export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function extractAudioFromVideo(videoFile: File): Promise<AudioBuffer> {
  const arrayBuffer = await videoFile.arrayBuffer();
  const audioContext = new AudioContext();
  return audioContext.decodeAudioData(arrayBuffer);
}

export function audioBufferToFloat32Array(audioBuffer: AudioBuffer): Float32Array {
  const channelData = audioBuffer.getChannelData(0);
  const targetSampleRate = 16000;
  const sourceSampleRate = audioBuffer.sampleRate;
  
  if (sourceSampleRate === targetSampleRate) {
    return channelData;
  }
  
  const ratio = sourceSampleRate / targetSampleRate;
  const targetLength = Math.round(channelData.length / ratio);
  const result = new Float32Array(targetLength);
  
  for (let i = 0; i < targetLength; i++) {
    const srcIndex = Math.min(Math.round(i * ratio), channelData.length - 1);
    result[i] = channelData[srcIndex];
  }
  
  return result;
}

export function generateThumbnail(videoElement: HTMLVideoElement, time: number): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d')!;
    
    const seekHandler = () => {
      ctx.drawImage(videoElement, 0, 0, 160, 90);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
      videoElement.removeEventListener('seeked', seekHandler);
    };
    
    videoElement.addEventListener('seeked', seekHandler);
    videoElement.currentTime = time;
  });
}
