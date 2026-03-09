'use client';

interface ProgressBarProps {
  progress: number;
  label?: string;
  color?: string;
  height?: number;
}

export default function ProgressBar({ progress, label, color = '#7c3aed', height = 4 }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">{label}</span>
          <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: '#2d2d2d' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
