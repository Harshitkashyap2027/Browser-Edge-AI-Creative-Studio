'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronDown, ChevronRight, Scissors, Captions, Palette, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import ProgressBar from './ProgressBar';
import type { StyleFilter, StudioState } from '@/hooks/useStudio';

interface AIPanelProps {
  state: StudioState;
  hasVideo: boolean;
  onToggleMasking: () => void;
  onToggleCaptioning: () => void;
  onSetStyleFilter: (filter: StyleFilter) => void;
  onSetStyleStrength: (strength: number) => void;
  onSetMaskBgColor: (color: string) => void;
  onSetMaskBgImage: (img: string | null) => void;
  onStartCaptioning: () => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid #2d2d2d' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#e5e7eb',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#7c3aed' }}>{icon}</span>
          {title}
        </div>
        {open ? <ChevronDown size={14} color="#6b7280" /> : <ChevronRight size={14} color="#6b7280" />}
      </button>
      {open && (
        <div className="fade-in" style={{ padding: '0 14px 14px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

const styleOptions: Array<{ value: StyleFilter; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'anime', label: 'Anime' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'sketch', label: 'Sketch' },
  { value: 'oilpainting', label: 'Oil Painting' },
  { value: 'watercolor', label: 'Watercolor' },
];

export default function AIPanel({
  state,
  hasVideo,
  onToggleMasking,
  onToggleCaptioning,
  onSetStyleFilter,
  onSetStyleStrength,
  onSetMaskBgColor,
  onSetMaskBgImage,
  onStartCaptioning,
}: AIPanelProps) {
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const handleBgImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      onSetMaskBgImage(url);
    },
    [onSetMaskBgImage]
  );

  const captioningStatus = state.processingStatus['captioning'];
  const captioningProgress = state.modelLoadingProgress['whisper'] || 0;

  return (
    <aside
      style={{
        width: 260,
        background: '#161616',
        borderLeft: '1px solid #2d2d2d',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #2d2d2d',
          background: '#1a1a1a',
        }}
      >
        <h2 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          AI Controls
        </h2>
      </div>

      {!hasVideo && (
        <div style={{ padding: 14, textAlign: 'center' }}>
          <p style={{ color: '#4b5563', fontSize: 12 }}>Upload a video to use AI features</p>
        </div>
      )}

      <Section title="Smart Masking" icon={<Scissors size={14} />} defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Enable Masking</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={state.isMaskingEnabled}
                onChange={onToggleMasking}
                disabled={!hasVideo}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {state.isMaskingEnabled && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 6 }}>
                  Background Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={state.maskBgColor}
                    onChange={(e) => onSetMaskBgColor(e.target.value)}
                  />
                  <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>
                    {state.maskBgColor}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 6 }}>
                  Background Image
                </label>
                <input
                  ref={bgImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBgImageUpload}
                />
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11, padding: '5px 10px', width: '100%' }}
                  onClick={() => bgImageInputRef.current?.click()}
                >
                  {state.maskBgImage ? 'Change Image' : 'Upload BG Image'}
                </button>
                {state.maskBgImage && (
                  <button
                    style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
                    onClick={() => onSetMaskBgImage(null)}
                  >
                    Remove image
                  </button>
                )}
              </div>

              <div
                style={{
                  padding: '8px 10px',
                  background: '#1a2a1a',
                  borderRadius: 6,
                  border: '1px solid #1e3a1e',
                }}
              >
                <p style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={11} />
                  Masking active — using edge-based detection
                </p>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="Auto Captioning" icon={<Captions size={14} />} defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {captioningStatus === 'loading' || captioningStatus === 'processing' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={14} color="#7c3aed" className="spin" />
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {captioningStatus === 'loading' ? 'Loading Whisper model...' : 'Transcribing audio...'}
                </span>
              </div>
              <ProgressBar
                progress={captioningProgress}
                label={captioningStatus === 'loading' ? 'Downloading model' : 'Transcribing'}
              />
            </div>
          ) : captioningStatus === 'done' ? (
            <div
              style={{
                padding: '8px 10px',
                background: '#1a2a1a',
                borderRadius: 6,
                border: '1px solid #1e3a1e',
              }}
            >
              <p style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={11} />
                {state.captions.length} captions generated
              </p>
            </div>
          ) : captioningStatus === 'error' ? (
            <div
              style={{
                padding: '8px 10px',
                background: '#2a1a1a',
                borderRadius: 6,
                border: '1px solid #3a1e1e',
              }}
            >
              <p style={{ fontSize: 11, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={11} />
                Captioning failed. Try again.
              </p>
            </div>
          ) : null}

          <button
            className="btn-primary"
            onClick={onStartCaptioning}
            disabled={!hasVideo || captioningStatus === 'loading' || captioningStatus === 'processing'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12 }}
          >
            {captioningStatus === 'loading' || captioningStatus === 'processing' ? (
              <><Loader2 size={12} className="spin" /> Processing...</>
            ) : (
              'Start Captioning'
            )}
          </button>

          <div>
            <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>Language</label>
            <select>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>
              Note: Uses Whisper (tiny.en model, ~74MB)
            </label>
            <div
              style={{
                padding: '6px 8px',
                background: '#1a1a2a',
                borderRadius: 4,
                border: '1px solid #2d2d3d',
              }}
            >
              <p style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4 }}>
                Model is downloaded and cached in your browser on first use.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Style Transfer" icon={<Palette size={14} />} defaultOpen={true}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 6 }}>
              Style Preset
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {styleOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSetStyleFilter(opt.value)}
                  disabled={!hasVideo}
                  style={{
                    padding: '7px 8px',
                    background: state.styleFilter === opt.value ? '#2a1f4a' : '#252525',
                    border: `1px solid ${state.styleFilter === opt.value ? '#7c3aed' : '#2d2d2d'}`,
                    borderRadius: 6,
                    color: state.styleFilter === opt.value ? '#c4b5fd' : '#9ca3af',
                    fontSize: 11,
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, color: '#6b7280' }}>Strength</label>
              <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>
                {Math.round(state.styleStrength * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={state.styleStrength}
              onChange={(e) => onSetStyleStrength(parseFloat(e.target.value))}
              disabled={!hasVideo || state.styleFilter === 'none'}
            />
          </div>

          {state.styleFilter !== 'none' && (
            <div
              className="fade-in"
              style={{
                padding: '8px 10px',
                background: '#1a1a2a',
                borderRadius: 6,
                border: '1px solid #2d2d3d',
              }}
            >
              <p style={{ fontSize: 11, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={11} />
                {styleOptions.find(o => o.value === state.styleFilter)?.label} filter active
              </p>
            </div>
          )}
        </div>
      </Section>

      <div style={{ marginTop: 'auto', padding: 14, borderTop: '1px solid #2d2d2d' }}>
        <p style={{ fontSize: 10, color: '#4b5563', textAlign: 'center', lineHeight: 1.5 }}>
          All AI processing runs locally<br />in your browser. No data is sent to servers.
        </p>
      </div>
    </aside>
  );
}
