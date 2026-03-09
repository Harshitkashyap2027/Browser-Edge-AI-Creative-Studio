'use client';

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, Film } from 'lucide-react';

interface UploadZoneProps {
  onVideoUpload: (file: File) => void;
}

export default function UploadZone({ onVideoUpload }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        onVideoUpload(file);
      }
    },
    [onVideoUpload]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onVideoUpload(file);
    },
    [onVideoUpload]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
      style={{
        border: `2px dashed ${isDragging ? '#7c3aed' : '#3d3d3d'}`,
        borderRadius: 12,
        background: isDragging ? 'rgba(124, 58, 237, 0.05)' : 'transparent',
        transition: 'all 200ms ease',
        minHeight: 300,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div
          style={{
            width: 72,
            height: 72,
            background: '#1e1e1e',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #2d2d2d',
          }}
        >
          <Film size={32} color="#7c3aed" />
        </div>
        <div>
          <p style={{ color: '#e5e7eb', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            Drop your video here
          </p>
          <p style={{ color: '#6b7280', fontSize: 13 }}>
            or click to browse — MP4, MOV, WebM supported
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
          <Upload size={14} />
          Choose Video
        </button>
      </div>
    </div>
  );
}
