// Sound and waveform types
export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom'
export type EffectType = 'reverb' | 'distortion'

export interface WaveformPoint {
  x: number
  y: number
  time: number
  isNewLine?: boolean
  gapDuration?: number  // Duration of gap before this point
}

export interface SavedSound {
  id: number
  name: string
  points: WaveformPoint[]
  waveform: WaveformType
  effects: {
    reverb: number
    distortion: number
  }
}

export interface LineSegment {
  startIndex: number
  endIndex: number
  points: WaveformPoint[]
}

// Timeline related types
export interface TimelineEvent {
  id: string
  soundId: number
  startTime: number
  duration: number
  track: number
}

// Editing and configuration types
export interface EditingState {
  isEditMode: boolean
  hoveredSegment: LineSegment | null
  selectedSegment: LineSegment | null
  tooltipPosition: { x: number; y: number } | null
  selectedLineSettings: {
    waveform: Exclude<WaveformType, 'custom'>
    volume: number
    frequencyRange: { min: number; max: number }
    adsr: { attack: number; decay: number; sustain: number; release: number }
    vibrato: { rate: number; depth: number }
  } | null
}

export interface DrawingConfig {
  tempo: number
  gridSize: number
  snapToGrid: boolean
  autoConnect: boolean
  loopMode: boolean
} 