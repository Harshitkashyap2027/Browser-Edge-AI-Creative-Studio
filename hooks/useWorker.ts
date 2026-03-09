import { useRef, useEffect, useCallback, useState } from 'react';

type WorkerStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'error';

interface WorkerResponse {
  id: string;
  type: string;
  payload: unknown;
  error?: string;
}

export function useWorker(workerFactory: () => Worker | null) {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>>(new Map());
  const [status, setStatus] = useState<WorkerStatus>('idle');
  const progressCallbacksRef = useRef<Map<string, (data: unknown) => void>>(new Map());

  useEffect(() => {
    try {
      const worker = workerFactory();
      if (!worker) return;
      
      workerRef.current = worker;
      setStatus('ready');

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, type, payload, error } = event.data;

        if (type === 'progress') {
          const cb = progressCallbacksRef.current.get(id);
          if (cb) cb(payload);
          return;
        }

        if (type === 'status') {
          setStatus(payload as WorkerStatus);
          return;
        }

        const pending = pendingRef.current.get(id);
        if (pending) {
          pendingRef.current.delete(id);
          progressCallbacksRef.current.delete(id);
          if (error) {
            pending.reject(new Error(error));
          } else {
            pending.resolve(payload);
          }
        }
      };

      worker.onerror = (err) => {
        console.error('Worker error:', err);
        setStatus('error');
        pendingRef.current.forEach(p => p.reject(new Error('Worker error')));
        pendingRef.current.clear();
      };
    } catch (err) {
      console.error('Failed to create worker:', err);
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pendingRef.current.clear();
    };
  // workerFactory is expected to be stable (created once) — omitting from deps is intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = useCallback(
    (type: string, payload: unknown, onProgress?: (data: unknown) => void): Promise<unknown> => {
      return new Promise((resolve, reject) => {
        const worker = workerRef.current;
        if (!worker) {
          reject(new Error('Worker not available'));
          return;
        }

        const id = Math.random().toString(36).slice(2);
        pendingRef.current.set(id, { resolve, reject });
        if (onProgress) progressCallbacksRef.current.set(id, onProgress);

        worker.postMessage({ id, type, payload });
      });
    },
    []
  );

  return { send, status };
}
