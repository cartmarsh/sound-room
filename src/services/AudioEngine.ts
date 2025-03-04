'use client'

import * as Tone from 'tone'
import { WaveformPoint, WaveformType } from '@/types/audio'

export class AudioEngine {
  private context: AudioContext | null = null
  private synth: Tone.MonoSynth | null = null
  private reverb: Tone.Reverb | null = null
  private distortion: Tone.Distortion | null = null
  
  constructor() {
    // Initialize when required to avoid audio context issues
  }
  
  private initialize() {
    if (this.context) return
    
    try {
      this.context = new AudioContext()
      
      // Use MonoSynth instead of PolySynth for single continuous sound
      this.synth = new Tone.MonoSynth({
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.8,
          release: 0.5
        }
      }).toDestination()
      
      // Create effects with safe default values
      this.reverb = new Tone.Reverb({
        decay: 3,
        wet: 0 // Start with no effect
      }).toDestination()
      
      this.distortion = new Tone.Distortion({
        distortion: 0, // Start with no distortion
        wet: 1 // Full effect when used
      }).toDestination()
      
      // Connect effects
      this.synth.connect(this.reverb)
      this.synth.connect(this.distortion)
      
      console.log('Audio engine initialized successfully')
    } catch (error) {
      console.error('Failed to initialize audio engine:', error)
    }
  }
  
  /**
   * Maps a y-coordinate to a frequency in Hz
   */
  private mapToFrequency(y: number, height: number): number {
    // Map y value (0=top to height=bottom) to frequency range (110Hz to 880Hz)
    const minFreq = 110 // A2
    const maxFreq = 880 // A5
    
    // Invert y value since canvas y increases downward
    const invertedY = height - y
    const normalizedY = invertedY / height
    
    // Apply logarithmic mapping for more natural musical intervals
    return minFreq * Math.pow(maxFreq / minFreq, normalizedY)
  }
  
  /**
   * Calculate time values for all points
   */
  private calculateTimeValues(
    points: WaveformPoint[], 
    duration?: number
  ): WaveformPoint[] {
    if (points.length === 0) return []
    
    const processedPoints = [...points]
    let totalTime = 0
    
    // First pass: calculate times based on x coordinates and gaps
    for (let i = 0; i < processedPoints.length; i++) {
      const point = processedPoints[i]
      
      // Handle gaps
      if (point.isNewLine && point.gapDuration && i > 0) {
        totalTime += point.gapDuration
      }
      
      // Calculate time based on x coordinate
      // We'll normalize later if a specific duration is provided
      point.time = totalTime + point.x / 1000
    }
    
    // If a specific duration is requested, normalize all times
    if (duration && processedPoints.length > 1) {
      const totalOriginalTime = processedPoints[processedPoints.length - 1].time - processedPoints[0].time
      const timeFactor = duration / totalOriginalTime
      
      const startTime = processedPoints[0].time
      
      for (const point of processedPoints) {
        point.time = (point.time - startTime) * timeFactor
      }
    }
    
    return processedPoints
  }
  
  /**
   * Play a sequence of points as a sound
   */
  async playSound(
    points: WaveformPoint[], 
    waveformType: WaveformType = 'sine',
    effects: { reverb: number; distortion: number } = { reverb: 0.001, distortion: 0 },
    duration?: number, 
    delayStart = 0
  ): Promise<void> {
    this.initialize()
    if (!this.synth || !this.reverb || !this.distortion || points.length < 2) return
    
    try {
      // Apply effects
      // Ensure minimum valid decay for reverb
      this.reverb.decay = Math.max(0.001, effects.reverb * 10) 
      
      // Set the wet parameter directly for better control over reverb amount
      if (this.reverb.wet && typeof this.reverb.wet.value !== 'undefined') {
        this.reverb.wet.value = effects.reverb;
      }
      
      // Apply distortion safely
      this.distortion.distortion = effects.distortion || 0
      
      // Calculate times for all points
      const processedPoints = this.calculateTimeValues(points, duration)
      
      // Ensure Tone.js is ready
      await Tone.start()
      
      // Create a sequence of notes
      const now = Tone.now() + delayStart
      
      // For custom waveform, use sine as fallback but ideally implement custom waveform later
      let actualWaveform: Exclude<WaveformType, 'custom'> = 
        waveformType === 'custom' ? 'sine' : waveformType
        
      // Set the waveform type  
      if (this.synth.oscillator) {
        this.synth.oscillator.type = actualWaveform
      }
      
      // Split points into continuous line segments
      const lineSegments: WaveformPoint[][] = []
      let currentSegment: WaveformPoint[] = []
      
      processedPoints.forEach(point => {
        if (point.isNewLine && currentSegment.length > 0) {
          lineSegments.push([...currentSegment])
          currentSegment = [point]
        } else {
          currentSegment.push(point)
        }
      })
      
      if (currentSegment.length > 0) {
        lineSegments.push(currentSegment)
      }
      
      // Play each line segment as a continuous tone
      for (const segment of lineSegments) {
        if (segment.length < 2) continue
        
        const segmentStart = segment[0]
        const segmentEnd = segment[segment.length - 1]
        const segmentDuration = segmentEnd.time - segmentStart.time
        
        // Skip if too short
        if (segmentDuration < 0.05) continue
        
        // Start note with initial frequency
        const startFreq = this.mapToFrequency(segmentStart.y, 400)
        this.synth.triggerAttack(startFreq, now + segmentStart.time)
        
        // Create frequency automation
        for (let i = 1; i < segment.length; i++) {
          const point = segment[i]
          const freq = this.mapToFrequency(point.y, 400)
          
          // Get direct access to frequency parameter for smooth transitions
          if (this.synth.frequency) {
            this.synth.frequency.setValueAtTime(freq, now + point.time)
          }
        }
        
        // End the note
        this.synth.triggerRelease(now + segmentEnd.time + 0.1)
      }
    } catch (error) {
      console.error("Error in AudioEngine.playSound:", error)
    }
  }
  
  /**
   * Stop all audio
   */
  stopAllSound(): void {
    if (this.synth) {
      this.synth.releaseAll()
    }
  }
  
  /**
   * Disconnect and clean up
   */
  dispose(): void {
    if (this.synth) this.synth.dispose()
    if (this.reverb) this.reverb.dispose()
    if (this.distortion) this.distortion.dispose()
    
    this.synth = null
    this.reverb = null
    this.distortion = null
    this.context = null
  }
}

// Export a singleton instance
const audioEngine = new AudioEngine()
export default audioEngine 