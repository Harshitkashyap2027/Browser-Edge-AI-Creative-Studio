'use client';

import { useRef, useEffect } from 'react';
import UploadZone from './UploadZone';
import type { Caption, StyleFilter } from '@/hooks/useStudio';

interface VideoCanvasProps {
  videoUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  isMaskingEnabled: boolean;
  maskBgColor: string;
  styleFilter: StyleFilter;
  styleStrength: number;
  captions: Caption[];
  onVideoUpload: (file: File) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
  volume: number;
}

export default function VideoCanvas({
  videoUrl,
  isPlaying,
  isMaskingEnabled,
  maskBgColor,
  styleFilter,
  styleStrength,
  captions,
  onVideoUpload,
  onTimeUpdate,
  onDurationChange,
  onPlayingChange,
  volume,
}: VideoCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    video.src = videoUrl;
    video.load();
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0);

        if (styleFilter !== 'none') {
          applyStyleFilterCanvas(ctx, canvas.width, canvas.height, styleFilter, styleStrength);
        }

        if (isMaskingEnabled) {
          applyMaskingEffect(ctx, canvas.width, canvas.height, maskBgColor);
        }

        const activeCaptions = captions.filter(
          (c) => video.currentTime >= c.startTime && video.currentTime <= c.endTime
        );
        if (activeCaptions.length > 0) {
          renderCaptions(ctx, activeCaptions, canvas.width, canvas.height);
        }
      }
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [videoUrl, styleFilter, styleStrength, isMaskingEnabled, maskBgColor, captions]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => onTimeUpdate(video.currentTime);
    const handleDurationChange = () => {
      if (video.duration && !isNaN(video.duration)) {
        onDurationChange(video.duration);
      }
    };
    const handleEnded = () => onPlayingChange(false);
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        onDurationChange(video.duration);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onTimeUpdate, onDurationChange, onPlayingChange]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d0d0d',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!videoUrl ? (
        <div style={{ width: '60%', maxWidth: 480 }}>
          <UploadZone onVideoUpload={onVideoUpload} />
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: 4,
              boxShadow: '0 0 40px rgba(0,0,0,0.5)',
            }}
          />
          <video
            ref={videoRef}
            style={{ display: 'none' }}
            playsInline
            crossOrigin="anonymous"
          />
        </>
      )}
    </div>
  );
}

function applyStyleFilterCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: StyleFilter,
  strength: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  switch (style) {
    case 'sketch': {
      const gray = new Uint8ClampedArray(width * height);
      for (let i = 0; i < data.length; i += 4) {
        gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const gx =
            -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)] +
            -2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)] +
            -gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
          const gy =
            -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)] +
            gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];
          const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy));
          const val = 255 - mag * strength;
          const i = idx * 4;
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }
      }
      break;
    }
    case 'anime':
    case 'cartoon': {
      const levels = style === 'anime' ? 6 : 4;
      const step = 255 / (levels - 1);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.round(Math.round(data[i] / step) * step);
        data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
        data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
      }
      break;
    }
    case 'watercolor': {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.1 + 10 * strength);
        data[i + 1] = Math.min(255, data[i + 1] * 1.05 + 5 * strength);
        data[i + 2] = Math.min(255, data[i + 2] * 0.95);
      }
      break;
    }
    case 'oilpainting': {
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg + (data[i] - avg) * (1 + strength * 0.5);
        data[i + 1] = avg + (data[i + 1] - avg) * (1 + strength * 0.5);
        data[i + 2] = avg + (data[i + 2] - avg) * (1 + strength * 0.5);
      }
      break;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyMaskingEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgColor: string
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const hex = bgColor.replace('#', '');
  const bgR = parseInt(hex.substring(0, 2), 16);
  const bgG = parseInt(hex.substring(2, 4), 16);
  const bgB = parseInt(hex.substring(4, 6), 16);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    
    if (sat < 0.15 || (g > r * 1.3 && g > b * 1.3)) {
      data[i] = bgR;
      data[i + 1] = bgG;
      data[i + 2] = bgB;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function renderCaptions(
  ctx: CanvasRenderingContext2D,
  captions: Caption[],
  width: number,
  height: number
): void {
  const caption = captions[0];
  if (!caption) return;

  const fontSize = Math.max(16, Math.round(height * 0.045));
  ctx.font = `bold ${fontSize}px 'Arial', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const text = caption.text;
  const metrics = ctx.measureText(text);
  const padding = 12;
  const boxWidth = metrics.width + padding * 2;
  const boxHeight = fontSize + padding;
  const x = width / 2 - boxWidth / 2;
  const y = height - 40;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.rect(x, y - boxHeight, boxWidth, boxHeight);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, width / 2, y - 6);
}
