'use client'

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { 
  DrawingConfig, 
  EditingState, 
  EffectType, 
  SavedSound, 
  TimelineEvent, 
  WaveformPoint, 
  WaveformType,
  // LineSegment
} from '@/types/audio'
import audioEngine from '@/services/AudioEngine'

interface AudioStore {
  // Drawing state
  points: WaveformPoint[]
  selectedWaveform: WaveformType
  isDrawing: boolean
  gapDuration: number
  
  // Saved sounds
  savedSounds: SavedSound[]
  nextSoundId: number
  
  // Timeline
  timelineEvents: TimelineEvent[]
  playheadPosition: number
  isPlaying: boolean
  
  // Effects
  effects: {
    reverb: number
    distortion: number
    filter: number
    delay: number
    chorus: number
  }
  
  // Drawing configuration
  drawingConfig: DrawingConfig
  
  // Editing state
  editingState: EditingState
  
  // Actions
  setPoints: (points: WaveformPoint[]) => void
  addPoint: (point: WaveformPoint) => void
  clearPoints: () => void
  setSelectedWaveform: (type: WaveformType) => void
  setIsDrawing: (isDrawing: boolean) => void
  setGapDuration: (duration: number) => void
  saveSound: (name: string) => void
  setEffect: (effect: EffectType, value: number) => void
  setDrawingConfig: (config: Partial<DrawingConfig>) => void
  setLoopMode: (enabled: boolean) => void
  addTimelineEvent: (soundId: number, track: number) => void
  updateTimelineEvent: (event: TimelineEvent) => void
  removeTimelineEvent: (id: string) => void
  setPlayheadPosition: (position: number) => void
  setIsPlaying: (isPlaying: boolean) => void
  updateEditingState: (state: Partial<EditingState>) => void
}

export const useAudioStore = create<AudioStore>((set) => ({
  // Initial state
  points: [],
  selectedWaveform: 'sine',
  isDrawing: false,
  gapDuration: 0,
  
  savedSounds: [],
  nextSoundId: 1,
  
  timelineEvents: [],
  playheadPosition: 0,
  isPlaying: false,
  
  effects: {
    reverb: 0,
    distortion: 0,
    filter: 0,
    delay: 0,
    chorus: 0
  },
  
  drawingConfig: {
    tempo: 120,
    gridSize: 20,
    snapToGrid: true,
    autoConnect: true,
    loopMode: false,
  },
  
  editingState: {
    isEditMode: false,
    hoveredSegment: null,
    selectedSegment: null,
    tooltipPosition: null,
    selectedLineSettings: null,
  },
  
  // Actions
  setPoints: (points) => set({ points }),
  
  addPoint: (point) => set((state) => ({ 
    points: [...state.points, point] 
  })),
  
  clearPoints: () => set({ points: [] }),
  
  setSelectedWaveform: (type) => set({ selectedWaveform: type }),
  
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  
  setGapDuration: (duration) => set({ gapDuration: duration }),
  
  saveSound: (name) => set((state) => {
    const newSound: SavedSound = {
      id: state.nextSoundId,
      name,
      points: [...state.points],
      waveform: state.selectedWaveform,
      effects: { ...state.effects },
    }
    
    return {
      savedSounds: [...state.savedSounds, newSound],
      nextSoundId: state.nextSoundId + 1,
    }
  }),
  
  setEffect: (effect, value) => set((state) => ({
    effects: {
      ...state.effects,
      [effect]: value,
    }
  })),
  
  setDrawingConfig: (config) => set((state) => ({
    drawingConfig: {
      ...state.drawingConfig,
      ...config,
    }
  })),
  
  setLoopMode: (enabled) => set((state) => {
    // Update the AudioEngine's loop mode if it's currently playing
    if (state.isPlaying) {
      audioEngine.setLoopMode(enabled);
    }
    
    return {
      drawingConfig: {
        ...state.drawingConfig,
        loopMode: enabled,
      }
    };
  }),
  
  addTimelineEvent: (soundId, track) => set((state) => {
    const newEvent: TimelineEvent = {
      id: uuidv4(),
      soundId,
      startTime: state.playheadPosition,
      duration: 2, // Default duration in seconds
      track,
    }
    
    return {
      timelineEvents: [...state.timelineEvents, newEvent],
    }
  }),
  
  updateTimelineEvent: (event) => set((state) => ({
    timelineEvents: state.timelineEvents.map((e) => 
      e.id === event.id ? event : e
    ),
  })),
  
  removeTimelineEvent: (id) => set((state) => ({
    timelineEvents: state.timelineEvents.filter((e) => e.id !== id),
  })),
  
  setPlayheadPosition: (position) => set({ playheadPosition: position }),
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  updateEditingState: (state) => set((current) => ({
    editingState: {
      ...current.editingState,
      ...state,
    }
  })),
})) 