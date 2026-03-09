'use client';

import { useRef, useEffect, useCallback, MouseEvent } from 'react';
import { formatTime } from '@/lib/videoUtils';
import type { Caption } from '@/hooks/useStudio';

interface TimelineProps {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  captions: Caption[];
  onSeek: (time: number) => void;
  onPlayPause: () => void;
}

const TRACK_HEIGHT = 24;
const HEADER_HEIGHT = 24;
const TRACKS = ['Video', 'Audio', 'Captions'];
const TIMELINE_HEIGHT = HEADER_HEIGHT + TRACKS.length * TRACK_HEIGHT + 8;

export default function Timeline({
  duration,
  currentTime,
  captions,
  onSeek,
}: TimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const getTimeFromX = useCallback(
    (x: number, canvasWidth: number): number => {
      const labelWidth = 72;
      const timelineWidth = canvasWidth - labelWidth;
      const relX = Math.max(0, Math.min(x - labelWidth, timelineWidth));
      return (relX / timelineWidth) * (duration || 1);
    },
    [duration]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = TIMELINE_HEIGHT;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#161616';
    ctx.fillRect(0, 0, width, height);

    const labelWidth = 72;
    const timelineWidth = width - labelWidth;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, HEADER_HEIGHT);
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_HEIGHT);
    ctx.lineTo(width, HEADER_HEIGHT);
    ctx.stroke();

    if (duration > 0) {
      const numMarkers = Math.max(5, Math.floor(timelineWidth / 60));
      const interval = duration / numMarkers;

      ctx.fillStyle = '#6b7280';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';

      for (let i = 0; i <= numMarkers; i++) {
        const time = i * interval;
        const x = labelWidth + (time / duration) * timelineWidth;

        ctx.strokeStyle = '#2d2d2d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, HEADER_HEIGHT - 6);
        ctx.lineTo(x, HEADER_HEIGHT);
        ctx.stroke();

        ctx.fillText(formatTime(time), x, HEADER_HEIGHT - 8);
      }
    }

    TRACKS.forEach((track, index) => {
      const y = HEADER_HEIGHT + index * TRACK_HEIGHT;

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, y, labelWidth, TRACK_HEIGHT);

      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(track, labelWidth - 8, y + TRACK_HEIGHT / 2 + 4);

      ctx.fillStyle = index % 2 === 0 ? '#181818' : '#161616';
      ctx.fillRect(labelWidth, y, timelineWidth, TRACK_HEIGHT);

      ctx.strokeStyle = '#2d2d2d';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y + TRACK_HEIGHT);
      ctx.lineTo(width, y + TRACK_HEIGHT);
      ctx.stroke();

      if (track === 'Video' && duration > 0) {
        ctx.fillStyle = '#7c3aed';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(labelWidth + 2, y + 3, timelineWidth - 4, TRACK_HEIGHT - 6);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 1;
        ctx.strokeRect(labelWidth + 2, y + 3, timelineWidth - 4, TRACK_HEIGHT - 6);
      }

      if (track === 'Audio' && duration > 0) {
        ctx.fillStyle = '#3b82f6';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(labelWidth + 2, y + 3, timelineWidth - 4, TRACK_HEIGHT - 6);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        const numBars = Math.floor((timelineWidth - 4) / 3);
        for (let b = 0; b < numBars; b++) {
          const bx = labelWidth + 2 + b * 3;
          const bh = (Math.sin(b * 0.7) * 0.4 + 0.5) * (TRACK_HEIGHT - 10);
          const by = y + (TRACK_HEIGHT - bh) / 2;
          ctx.moveTo(bx, by);
          ctx.lineTo(bx, by + bh);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (track === 'Captions' && captions.length > 0 && duration > 0) {
        captions.forEach((cap) => {
          const capX = labelWidth + (cap.startTime / duration) * timelineWidth;
          const capW = Math.max(4, ((cap.endTime - cap.startTime) / duration) * timelineWidth);

          ctx.fillStyle = '#10b981';
          ctx.globalAlpha = 0.6;
          ctx.fillRect(capX, y + 4, capW, TRACK_HEIGHT - 8);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1;
          ctx.strokeRect(capX, y + 4, capW, TRACK_HEIGHT - 8);
        });
      }
    });

    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(labelWidth, 0);
    ctx.lineTo(labelWidth, height);
    ctx.stroke();

    if (duration > 0) {
      const playheadX = labelWidth + (currentTime / duration) * timelineWidth;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, 0);
      ctx.lineTo(playheadX + 5, 0);
      ctx.lineTo(playheadX + 5, 10);
      ctx.lineTo(playheadX, 15);
      ctx.lineTo(playheadX - 5, 10);
      ctx.closePath();
      ctx.fill();
    }
  }, [duration, currentTime, captions]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      isDraggingRef.current = true;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      onSeek(getTimeFromX(x, rect.width));
    },
    [getTimeFromX, onSeek]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (!isDraggingRef.current) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      onSeek(getTimeFromX(x, rect.width));
    },
    [getTimeFromX, onSeek]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return (
    <div
      style={{
        background: '#161616',
        borderTop: '1px solid #2d2d2d',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: 32,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 8,
          borderBottom: '1px solid #2d2d2d',
          background: '#1a1a1a',
        }}
      >
        <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div ref={containerRef} style={{ width: '100%' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: TIMELINE_HEIGHT, cursor: 'pointer', display: 'block' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}
