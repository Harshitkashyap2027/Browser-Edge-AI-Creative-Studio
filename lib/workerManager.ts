type WorkerMessage = {
  id: string;
  type: string;
  payload: unknown;
};

type WorkerResponse = {
  id: string;
  type: string;
  payload: unknown;
  error?: string;
};

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

export class WorkerManager {
  private worker: Worker | null = null;
  private pending: Map<string, PendingRequest> = new Map();
  private workerUrl: string;

  constructor(workerUrl: string) {
    this.workerUrl = workerUrl;
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(this.workerUrl, { type: 'module' });
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, type, payload, error } = event.data;
        
        if (type === 'progress') {
          return;
        }
        
        const pending = this.pending.get(id);
        if (pending) {
          this.pending.delete(id);
          if (error) {
            pending.reject(new Error(error));
          } else {
            pending.resolve(payload);
          }
        }
      };
      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        this.pending.forEach((pending) => {
          pending.reject(new Error('Worker error: ' + error.message));
        });
        this.pending.clear();
      };
    }
    return this.worker;
  }

  send(type: string, payload: unknown, onProgress?: (data: unknown) => void): Promise<unknown> {
    const worker = this.ensureWorker();
    const id = Math.random().toString(36).slice(2);
    
    if (onProgress) {
      const originalOnMessage = worker.onmessage;
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'progress' && event.data.id === id) {
          onProgress(event.data.payload);
          return;
        }
        if (originalOnMessage) originalOnMessage.call(worker, event);
      };
    }
    
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, type, payload } as WorkerMessage);
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pending.clear();
  }
}
