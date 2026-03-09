'use client';

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export default function SkeletonLoader({ width = '100%', height = 16, className = '', rounded = false }: SkeletonLoaderProps) {
  return (
    <div
      className={`pulse ${className}`}
      style={{
        width,
        height,
        background: '#252525',
        borderRadius: rounded ? '50%' : 4,
      }}
    />
  );
}
