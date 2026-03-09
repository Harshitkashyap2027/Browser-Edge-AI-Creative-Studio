'use client';

import { useCallback, useRef } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import VideoCanvas from './VideoCanvas';
import Timeline from './Timeline';
import AIPanel from './AIPanel';
import { useStudio } from '@/hooks/useStudio';
import { extractAudioFromVideo, audioBufferToFloat32Array } from '@/lib/videoUtils';
import type { Caption } from '@/hooks/useStudio';

export default function Studio() {
  const {
    state,
    loadVideo,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    toggleMasking,
    toggleCaptioning,
    setStyleFilter,
    setStyleStrength,
    setCaptions,
    setMaskBgColor,
    setMaskBgImage,
    setModelProgress,
    setProcessingStatus,
    setActiveTool,
  } = useStudio();

  const captioningWorkerRef = useRef<Worker | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const handleVideoElementReady = useCallback((video: HTMLVideoElement) => {
    videoElementRef.current = video;
  }, []);

  const handleVideoUpload = useCallback(
    (file: File) => {
      loadVideo(file);
    },
    [loadVideo]
  );

  const handleExport = useCallback(() => {
    if (!state.videoUrl) return;
    const a = document.createElement('a');
    a.href = state.videoUrl;
    a.download = 'studio-export.mp4';
    a.click();
  }, [state.videoUrl]);

  const handleSeek = useCallback(
    (time: number) => {
      setCurrentTime(time);
      if (videoElementRef.current) videoElementRef.current.currentTime = time;
    },
    [setCurrentTime]
  );

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!state.isPlaying);
  }, [state.isPlaying, setIsPlaying]);

  const handleStartCaptioning = useCallback(async () => {
    if (!state.videoFile) return;

    setProcessingStatus('captioning', 'loading');
    setModelProgress('whisper', 0);

    try {
      const audioBuffer = await extractAudioFromVideo(state.videoFile);
      const audioData = audioBufferToFloat32Array(audioBuffer);

      if (!captioningWorkerRef.current) {
        captioningWorkerRef.current = new Worker(
          new URL('../workers/captioning.worker.ts', import.meta.url),
          { type: 'module' }
        );
      }

      const worker = captioningWorkerRef.current;
      setProcessingStatus('captioning', 'processing');

      worker.onmessage = (event) => {
        const { type, payload } = event.data;

        if (type === 'progress') {
          const { stage, progress } = payload as { stage: string; progress: number; message: string };
          if (stage === 'downloading' || stage === 'loading') {
            setProcessingStatus('captioning', 'loading');
            setModelProgress('whisper', progress);
          } else if (stage === 'transcribing') {
            setProcessingStatus('captioning', 'processing');
            setModelProgress('whisper', progress);
          }
        }

        if (type === 'result') {
          if (event.data.error) {
            console.error('Captioning error:', event.data.error);
            setProcessingStatus('captioning', 'error');
          } else {
            setCaptions(payload as Caption[]);
            setProcessingStatus('captioning', 'done');
            setModelProgress('whisper', 100);
          }
        }
      };

      const id = Math.random().toString(36).slice(2);
      worker.postMessage({ id, type: 'transcribe', payload: { audioData, language: 'en' } });
    } catch (err) {
      console.error('Failed to start captioning:', err);
      setProcessingStatus('captioning', 'error');
    }
  }, [state.videoFile, setCaptions, setModelProgress, setProcessingStatus]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0d0d0d',
        overflow: 'hidden',
      }}
    >
      <Header
        projectName={state.videoFile?.name || 'Untitled Project'}
        isPlaying={state.isPlaying}
        onPlay={() => setIsPlaying(true)}
        onStop={() => setIsPlaying(false)}
        onExport={handleExport}
        hasVideo={!!state.videoUrl}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          activeTool={state.activeTool}
          onToolChange={setActiveTool}
          hasVideo={!!state.videoUrl}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <VideoCanvas
            videoUrl={state.videoUrl}
            isPlaying={state.isPlaying}
            currentTime={state.currentTime}
            isMaskingEnabled={state.isMaskingEnabled}
            maskBgColor={state.maskBgColor}
            styleFilter={state.styleFilter}
            styleStrength={state.styleStrength}
            captions={state.captions}
            onVideoUpload={handleVideoUpload}
            onTimeUpdate={setCurrentTime}
            onDurationChange={setDuration}
            onPlayingChange={setIsPlaying}
            onVideoElementReady={handleVideoElementReady}
            volume={state.volume}
          />

          <Timeline
            duration={state.duration}
            currentTime={state.currentTime}
            isPlaying={state.isPlaying}
            captions={state.captions}
            onSeek={handleSeek}
            onPlayPause={handlePlayPause}
          />
        </div>

        <AIPanel
          state={state}
          hasVideo={!!state.videoUrl}
          onToggleMasking={toggleMasking}
          onToggleCaptioning={toggleCaptioning}
          onSetStyleFilter={setStyleFilter}
          onSetStyleStrength={setStyleStrength}
          onSetMaskBgColor={setMaskBgColor}
          onSetMaskBgImage={setMaskBgImage}
          onStartCaptioning={handleStartCaptioning}
        />
      </div>
    </div>
  );
}
