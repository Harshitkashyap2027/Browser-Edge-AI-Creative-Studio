'use client';

import { Save, Download, Settings, Zap, Play, Square } from 'lucide-react';

interface HeaderProps {
  projectName: string;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onExport: () => void;
  hasVideo: boolean;
}

export default function Header({ projectName, isPlaying, onPlay, onStop, onExport, hasVideo }: HeaderProps) {
  return (
    <header
      style={{
        height: 48,
        background: '#161616',
        borderBottom: '1px solid #2d2d2d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* Logo + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 28,
            height: 28,
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={16} color="white" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#e5e7eb', letterSpacing: '-0.01em' }}>
          Edge AI Studio
        </span>
        <span style={{ color: '#3d3d3d', fontSize: 12 }}>|</span>
        <span style={{ color: '#6b7280', fontSize: 13 }}>{projectName}</span>
      </div>

      {/* Transport controls */}
      {hasVideo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isPlaying ? (
            <button
              className="btn-secondary"
              onClick={onStop}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px' }}
            >
              <Square size={12} />
              Stop
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={onPlay}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px' }}
            >
              <Play size={12} />
              Play
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Save size={13} />
          Save
        </button>
        <button
          className="btn-primary"
          onClick={onExport}
          disabled={!hasVideo}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Download size={13} />
          Export
        </button>
        <button
          style={{
            width: 32,
            height: 32,
            background: '#252525',
            border: '1px solid #2d2d2d',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#9ca3af',
          }}
        >
          <Settings size={14} />
        </button>
      </div>
    </header>
  );
}
