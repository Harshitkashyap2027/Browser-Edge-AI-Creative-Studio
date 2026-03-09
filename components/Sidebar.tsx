'use client';

import { MousePointer2, Crop, Scissors, Captions, Palette, Layers } from 'lucide-react';
import type { ActiveTool } from '@/hooks/useStudio';

interface SidebarProps {
  activeTool: ActiveTool;
  onToolChange: (tool: ActiveTool) => void;
  hasVideo: boolean;
}

const tools: Array<{ id: ActiveTool; icon: React.ReactNode; label: string }> = [
  { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select' },
  { id: 'crop', icon: <Crop size={18} />, label: 'Crop' },
  { id: 'mask', icon: <Scissors size={18} />, label: 'Mask' },
  { id: 'caption', icon: <Captions size={18} />, label: 'Caption' },
  { id: 'style', icon: <Palette size={18} />, label: 'Style' },
];

export default function Sidebar({ activeTool, onToolChange, hasVideo }: SidebarProps) {
  return (
    <aside
      style={{
        width: 64,
        background: '#161616',
        borderRight: '1px solid #2d2d2d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: 4,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          background: '#1e1e1e',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          border: '1px solid #2d2d2d',
        }}
      >
        <Layers size={16} color="#7c3aed" />
      </div>

      <div
        style={{
          width: '80%',
          height: 1,
          background: '#2d2d2d',
          margin: '4px 0',
        }}
      />

      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => onToolChange(tool.id)}
          title={tool.label}
          style={{ opacity: !hasVideo && tool.id !== 'select' ? 0.4 : 1 }}
          disabled={!hasVideo && tool.id !== 'select'}
        >
          {tool.icon}
          <span style={{ fontSize: 9, letterSpacing: '0.01em' }}>{tool.label}</span>
        </button>
      ))}
    </aside>
  );
}
