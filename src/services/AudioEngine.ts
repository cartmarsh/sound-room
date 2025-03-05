'use client'

import * as Tone from 'tone'
import { WaveformPoint, WaveformType } from '@/types/audio'

export class AudioEngine {
  private context: AudioContext | null = null
  private synth: Tone.MonoSynth | null = null
  private reverb: Tone.Reverb | null = null
  private distortion: Tone.Distortion | null = null
  private filter: Tone.Filter | null = null
  private delay: Tone.FeedbackDelay | null = null
  private chorus: Tone.Chorus | null = null
  
  constructor() {
    // Initialize when required to avoid audio context issues
  }
  
  private initialize() {
    if (this.context) return
    
    try {
      this.context = new AudioContext()
      
      // Enhanced MonoSynth with better default settings
      this.synth = new Tone.MonoSynth({
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.05,
          decay: 0.3,
          sustain: 0.6,
          release: 1.0,
          attackCurve: 'exponential',
          releaseCurve: 'exponential'
        },
        filter: {
          Q: 1,
          type: 'lowpass',
          rolloff: -12
        },
        filterEnvelope: {
          attack: 0.2,
          decay: 0.5,
          sustain: 0.5,
          release: 2,
          baseFrequency: 200,
          octaves: 3,
          exponent: 2
        }
      })
      
      // Create effects chain
      this.filter = new Tone.Filter({
        type: 'lowpass',
        frequency: 2000,
        rolloff: -12,
        Q: 1
      })
      
      this.chorus = new Tone.Chorus({
        frequency: 4,
        delayTime: 2.5,
        depth: 0.7,
        wet: 0.1
      }).start() // Chorus needs to be started
      
      this.delay = new Tone.FeedbackDelay({
        delayTime: 0.3,
        feedback: 0.4,
        wet: 0.1
      })
      
      this.reverb = new Tone.Reverb({
        decay: 2.5,
        preDelay: 0.1,
        wet: 0.3
      })
      
      this.distortion = new Tone.Distortion({
        distortion: 0.2,
        oversample: '4x',
        wet: 0.1
      })
      
      // Connect effects in series (remove individual toDestination calls)
      this.synth.chain(
        this.filter,
        this.chorus,
        this.delay,
        this.reverb,
        this.distortion,
        Tone.Destination
      )
      
      console.log('Audio engine initialized with effects chain')
    } catch (error) {
      console.error('Failed to initialize audio engine:', error)
    }
  }
  
  /**
   * Maps a y-coordinate to a frequency in Hz
   */
  private mapToFrequency(y: number, height: number): number {
    // Extended frequency range for more musical possibilities
    const minFreq = 55  // A1
    const maxFreq = 1760 // A6
    
    const invertedY = height - y
    const normalizedY = invertedY / height
    
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
    effects: { 
      reverb: number; 
      distortion: number;
      filter?: number;
      delay?: number;
      chorus?: number;
    } = { 
      reverb: 0.3, 
      distortion: 0.1,
      filter: 2000,
      delay: 0.1,
      chorus: 0.1
    },
    duration?: number, 
    delayStart = 0
  ): Promise<void> {
    this.initialize()
    if (!this.synth || !this.reverb || !this.distortion || !this.filter || !this.delay || !this.chorus || points.length < 2) return
    
    try {
      // Apply effects with logging
      console.log('Applying effects:', effects)
      
      // Reverb
      this.reverb.decay = Math.max(0.001, effects.reverb * 10)
      if (this.reverb.wet) {
        this.reverb.wet.value = effects.reverb
        console.log('Reverb wet:', this.reverb.wet.value)
      }
      
      // Distortion
      this.distortion.distortion = effects.distortion || 0
      if (this.distortion.wet) {
        this.distortion.wet.value = effects.distortion || 0
        console.log('Distortion amount:', this.distortion.distortion)
      }
      
      // Filter
      if (effects.filter && this.filter.frequency) {
        this.filter.frequency.value = effects.filter
        console.log('Filter frequency:', this.filter.frequency.value)
      }
      
      // Delay with feedback adjustment
      if (effects.delay && this.delay.wet) {
        this.delay.wet.value = effects.delay
        this.delay.feedback.value = effects.delay * 0.6 // Proportional feedback
        console.log('Delay wet:', this.delay.wet.value, 'feedback:', this.delay.feedback.value)
      }
      
      // Chorus
      if (effects.chorus && this.chorus.wet) {
        this.chorus.wet.value = effects.chorus
        console.log('Chorus wet:', this.chorus.wet.value)
      }
      
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
      this.synth.triggerRelease() // Fix for releaseAll error
    }
  }
  
  /**
   * Disconnect and clean up
   */
  dispose(): void {
    if (this.synth) this.synth.dispose()
    if (this.reverb) this.reverb.dispose()
    if (this.distortion) this.distortion.dispose()
    if (this.filter) this.filter.dispose()
    if (this.delay) this.delay.dispose()
    if (this.chorus) this.chorus.dispose()
    
    this.synth = null
    this.reverb = null
    this.distortion = null
    this.filter = null
    this.delay = null
    this.chorus = null
    this.context = null
  }
}

// Export a singleton instance
const audioEngine = new AudioEngine()
export default audioEngine 