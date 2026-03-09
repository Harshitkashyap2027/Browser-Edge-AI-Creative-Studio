// Captioning worker using @xenova/transformers for Whisper

interface WorkerMessage {
  id: string;
  type: string;
  payload: {
    audioData: Float32Array;
    language?: string;
  };
}

interface Caption {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipeline: ((audio: Float32Array, options: Record<string, unknown>) => Promise<any>) | null = null;
let isLoading = false;

async function loadModel(id: string): Promise<void> {
  if (pipeline || isLoading) return;
  isLoading = true;

  try {
    // @ts-ignore
    const { pipeline: createPipeline, env } = await import('@xenova/transformers');
    
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    self.postMessage({
      id,
      type: 'progress',
      payload: { stage: 'loading', progress: 0, message: 'Loading Whisper model...' },
    });

    pipeline = await createPipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progress_callback: (progress: { status: string; progress?: number; name?: string }) => {
        if (progress.status === 'downloading') {
          self.postMessage({
            id,
            type: 'progress',
            payload: {
              stage: 'downloading',
              progress: progress.progress || 0,
              message: `Downloading model: ${progress.name || ''}`,
            },
          });
        }
      },
    });

    self.postMessage({
      id,
      type: 'progress',
      payload: { stage: 'ready', progress: 100, message: 'Model ready' },
    });
  } catch (err) {
    isLoading = false;
    throw err;
  }

  isLoading = false;
}

async function transcribeAudio(
  id: string,
  audioData: Float32Array,
  language = 'en'
): Promise<Caption[]> {
  await loadModel(id);

  if (!pipeline) {
    throw new Error('Model not loaded');
  }

  self.postMessage({
    id,
    type: 'progress',
    payload: { stage: 'transcribing', progress: 0, message: 'Transcribing audio...' },
  });

  const result = await pipeline(audioData, {
    language,
    task: 'transcribe',
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  });

  const captions: Caption[] = [];

  if (result && result.chunks) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.chunks.forEach((chunk: any, index: number) => {
      const [start, end] = chunk.timestamp;
      captions.push({
        id: `cap-${index}`,
        startTime: start || 0,
        endTime: end || (start || 0) + 3,
        text: chunk.text.trim(),
      });
    });
  } else {
    captions.push({
      id: 'cap-0',
      startTime: 0,
      endTime: audioData.length / 16000,
      text: 'Transcription complete',
    });
  }

  return captions;
}

self.onmessage = async function (event: MessageEvent<WorkerMessage>) {
  const { id, type, payload } = event.data;

  if (type === 'transcribe') {
    try {
      const captions = await transcribeAudio(id, payload.audioData, payload.language);
      self.postMessage({ id, type: 'result', payload: captions });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      self.postMessage({ id, type: 'result', error: message });
    }
  }

  if (type === 'loadModel') {
    try {
      await loadModel(id);
      self.postMessage({ id, type: 'result', payload: { loaded: true } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Model loading failed';
      self.postMessage({ id, type: 'result', error: message });
    }
  }
};

export {};
