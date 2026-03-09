import { useState, useCallback, useRef } from 'react';

export interface Caption {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export type StyleFilter = 'none' | 'anime' | 'cartoon' | 'sketch' | 'oilpainting' | 'watercolor';
export type ActiveTool = 'select' | 'crop' | 'mask' | 'caption' | 'style';

export interface StudioState {
  videoFile: File | null;
  videoUrl: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isMaskingEnabled: boolean;
  isCaptioningEnabled: boolean;
  styleFilter: StyleFilter;
  styleStrength: number;
  captions: Caption[];
  maskBgColor: string;
  maskBgImage: string | null;
  modelLoadingProgress: Record<string, number>;
  processingStatus: Record<string, string>;
  activeTool: ActiveTool;
  volume: number;
}

const initialState: StudioState = {
  videoFile: null,
  videoUrl: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  isMaskingEnabled: false,
  isCaptioningEnabled: false,
  styleFilter: 'none',
  styleStrength: 0.8,
  captions: [],
  maskBgColor: '#0066ff',
  maskBgImage: null,
  modelLoadingProgress: {},
  processingStatus: {},
  activeTool: 'select',
  volume: 1,
};

export function useStudio() {
  const [state, setState] = useState<StudioState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const updateState = useCallback((updates: Partial<StudioState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadVideo = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    updateState({ videoFile: file, videoUrl: url, currentTime: 0, isPlaying: false });
  }, [updateState]);

  const setCurrentTime = useCallback((time: number) => {
    updateState({ currentTime: time });
  }, [updateState]);

  const setDuration = useCallback((duration: number) => {
    updateState({ duration });
  }, [updateState]);

  const setIsPlaying = useCallback((isPlaying: boolean) => {
    updateState({ isPlaying });
  }, [updateState]);

  const toggleMasking = useCallback(() => {
    updateState({ isMaskingEnabled: !stateRef.current.isMaskingEnabled });
  }, [updateState]);

  const toggleCaptioning = useCallback(() => {
    updateState({ isCaptioningEnabled: !stateRef.current.isCaptioningEnabled });
  }, [updateState]);

  const setStyleFilter = useCallback((filter: StyleFilter) => {
    updateState({ styleFilter: filter });
  }, [updateState]);

  const setStyleStrength = useCallback((strength: number) => {
    updateState({ styleStrength: strength });
  }, [updateState]);

  const setCaptions = useCallback((captions: Caption[]) => {
    updateState({ captions });
  }, [updateState]);

  const setMaskBgColor = useCallback((color: string) => {
    updateState({ maskBgColor: color });
  }, [updateState]);

  const setMaskBgImage = useCallback((image: string | null) => {
    updateState({ maskBgImage: image });
  }, [updateState]);

  const setModelProgress = useCallback((model: string, progress: number) => {
    setState(prev => ({
      ...prev,
      modelLoadingProgress: { ...prev.modelLoadingProgress, [model]: progress },
    }));
  }, []);

  const setProcessingStatus = useCallback((key: string, status: string) => {
    setState(prev => ({
      ...prev,
      processingStatus: { ...prev.processingStatus, [key]: status },
    }));
  }, []);

  const setActiveTool = useCallback((tool: ActiveTool) => {
    updateState({ activeTool: tool });
  }, [updateState]);

  const setVolume = useCallback((volume: number) => {
    updateState({ volume });
  }, [updateState]);

  return {
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
    setVolume,
  };
}
