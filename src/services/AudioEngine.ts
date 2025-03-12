'use client'

import * as Tone from 'tone'
import { WaveformPoint, WaveformType } from '@/types/audio'

export class AudioEngine {
  private context: AudioContext | null = null
  private monosynth: Tone.MonoSynth | null = null
  private reverb: Tone.Reverb | null = null
  private distortion: Tone.Distortion | null = null
  private filter: Tone.Filter | null = null
  private delay: Tone.FeedbackDelay | null = null
  private chorus: Tone.Chorus | null = null
  private loopId: number | null = null
  private isLooping: boolean = false
  private finishCurrentLoop: boolean = false
  private onPlaybackComplete: (() => void) | null = null
  private pointsUpdateCallback: (() => WaveformPoint[]) | null = null
  
  
  constructor() {
    // Initialize when required to avoid audio context issues
  }
  
  private initialize() {
    if (this.context) return
    
    try {
      this.context = new AudioContext()
      
      // Enhanced MonoSynth with better default settings
      this.monosynth = new Tone.MonoSynth({
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
      this.monosynth.chain(
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
    duration?: number,
    bpm: number = 120
  ): WaveformPoint[] {
    if (points.length === 0) return []
    
    const processedPoints = [...points]
    let totalTime = 0
    
    // BPM scaling factor (120 BPM is the reference tempo)
    const tempoFactor = 120 / bpm
    
    // First pass: calculate times based on x coordinates and gaps
    for (let i = 0; i < processedPoints.length; i++) {
      const point = processedPoints[i]
      
      // Handle gaps
      if (point.isNewLine && point.gapDuration && i > 0) {
        // Apply tempo scaling to gaps as well
        totalTime += point.gapDuration * tempoFactor
      }
      
      // Calculate time based on x coordinate with BPM scaling
      // Higher BPM = faster playback = smaller time values
      point.time = totalTime + (point.x / 1000) * tempoFactor
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
    delayStart = 0,
    bpm: number = 120,
    loop: boolean = false,
    onComplete?: () => void,
    pointsUpdateCallback?: () => WaveformPoint[]
  ): Promise<void> {
    this.initialize()
    if (!this.monosynth || !this.reverb || !this.distortion || !this.filter || !this.delay || !this.chorus || points.length < 2) return
    
    // Clear any existing loop
    this.stopLoop()
    
    // Set the loop state and callback
    this.isLooping = loop
    this.finishCurrentLoop = false
    this.onPlaybackComplete = onComplete || null
    this.pointsUpdateCallback = pointsUpdateCallback || null
    
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
      
      // Calculate times for all points with BPM
      const processedPoints = this.calculateTimeValues(points, duration, bpm)
      
      // Calculate total duration of the sound for later use
      const lastPoint = processedPoints[processedPoints.length - 1]
      const totalDuration = lastPoint.time + 0.5 // Add a small buffer
      
      // Ensure Tone.js is ready
      await Tone.start()
      
      // Create a sequence of notes
      const now = Tone.now() + delayStart
      
      // For custom waveform, use sine as fallback but ideally implement custom waveform later
      const actualWaveform = waveformType === 'custom' ? 'sine' : waveformType
        
      // Set the waveform type  
      if (this.monosynth.oscillator) {
        this.monosynth.oscillator.type = actualWaveform
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
        if (segmentDuration < 0.02) continue
        
        // Start note with initial frequency
        const startFreq = this.mapToFrequency(segmentStart.y, 400)
        this.monosynth.triggerAttack(startFreq, now + segmentStart.time)
        
        // Create frequency automation
        for (let i = 1; i < segment.length; i++) {
          const point = segment[i]
          const freq = this.mapToFrequency(point.y, 400)
          
          // Get direct access to frequency parameter for smooth transitions
          if (this.monosynth.frequency) {
            this.monosynth.frequency.setValueAtTime(freq, now + point.time)
          }
        }
        
        // End the note
        this.monosynth.triggerRelease(now + segmentEnd.time + 0.1)
      }
      
      // If loop mode is enabled, schedule the next playback
      if ((loop && this.isLooping) || this.finishCurrentLoop) {
        // Schedule the next loop iteration
        this.loopId = window.setTimeout(() => {
          // If we're finishing the current loop and not looping anymore
          if (this.finishCurrentLoop && !this.isLooping) {
            this.finishCurrentLoop = false
            if (this.onPlaybackComplete) {
              this.onPlaybackComplete();
            }
          } 
          // Only continue looping if isLooping is still true
          else if (this.isLooping) {
            // Get updated points if a callback is provided
            const updatedPoints = this.pointsUpdateCallback ? this.pointsUpdateCallback() : points;
            
            // Only play if we have enough points
            if (updatedPoints.length >= 2) {
              this.playSound(
                updatedPoints, 
                waveformType, 
                effects, 
                duration, 
                0, 
                bpm, 
                loop, 
                onComplete,
                pointsUpdateCallback
              );
            } else if (this.onPlaybackComplete) {
              this.onPlaybackComplete();
            }
          }
        }, totalDuration * 1000)
      } else if (!loop && this.onPlaybackComplete) {
        // If not looping, call onComplete after the sound finishes
        setTimeout(() => {
          if (this.onPlaybackComplete) {
            this.onPlaybackComplete();
          }
        }, totalDuration * 1000);
      }
    } catch (error) {
      console.error("Error in AudioEngine.playSound:", error)
    }
  }
  
  /**
   * Set loop mode - if currently playing, will finish the current loop
   */
  setLoopMode(enabled: boolean): void {
    if (this.isLooping && !enabled) {
      // If turning off loop while playing, finish current loop then stop
      this.finishCurrentLoop = true;
      this.isLooping = false;
    } else {
      this.isLooping = enabled;
      this.finishCurrentLoop = false;
    }
  }
  
  /**
   * Stop all audio and any active loops
   */
  stopAllSound(): void {
    if (this.monosynth) {
      this.monosynth.triggerRelease() // Fix for releaseAll error
    }
    
    // Stop any active loop and set isLooping to false
    this.isLooping = false;
    this.finishCurrentLoop = false;
    this.onPlaybackComplete = null;
    this.pointsUpdateCallback = null;
    this.stopLoop();
  }
  
  /**
   * Stop any active loop
   */
  private stopLoop(): void {
    if (this.loopId !== null) {
      window.clearTimeout(this.loopId)
      this.loopId = null
    }
  }
  
  /**
   * Render and download a sound as a WAV file
   */
  async downloadSoundAsAudio(
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
    filename = 'sound.wav',
    bpm: number = 120
  ): Promise<void> {
    this.initialize()
    if (!this.monosynth || !this.reverb || !this.distortion || !this.filter || !this.delay || !this.chorus || points.length < 2) {
      console.error('Audio engine not properly initialized or no points provided')
      return
    }
    
    try {
      // Calculate total duration based on the last point's time plus a buffer for release and effects tail
      const processedPoints = this.calculateTimeValues(points, duration, bpm)
      const lastPoint = processedPoints[processedPoints.length - 1]
      const totalDuration = lastPoint.time + 2.0 // Add 2 seconds for release tail and reverb decay
      
      // Create a recorder to capture the audio output
      const recorder = new Tone.Recorder()
      
      // Connect the master output to the recorder
      Tone.getDestination().connect(recorder)
      
      // Start recording
      await recorder.start()
      
      // Play the sound with all effects (using the exact same method as normal playback)
      await this.playSound(points, waveformType, effects, duration, 0, bpm)
      
      // Wait for the sound to finish playing, including reverb and delay tails
      // The longer wait ensures all effects like reverb tails are captured
      await new Promise(resolve => setTimeout(resolve, (totalDuration + 1.0) * 1000))
      
      // Stop the recording and get the audio buffer (WebM format)
      const webmBlob = await recorder.stop()
      
      // Convert WebM to WAV
      const wavBlob = await this.convertToWav(webmBlob)
      
      // Create a download link
      const url = URL.createObjectURL(wavBlob)
      const anchor = document.createElement('a')
      anchor.download = filename
      anchor.href = url
      anchor.click()
      
      // Clean up
      URL.revokeObjectURL(url)
      recorder.dispose()
      
      console.log(`Sound downloaded as ${filename}`)
    } catch (error) {
      console.error('Error in AudioEngine.downloadSoundAsAudio:', error)
    }
  }
  
  /**
   * Convert WebM audio blob to WAV format
   */
  private async convertToWav(webmBlob: Blob): Promise<Blob> {
    try {
      // Create an audio context
      const audioContext = new AudioContext()
      
      // Convert the blob to an array buffer
      const arrayBuffer = await webmBlob.arrayBuffer()
      
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Get the raw PCM data
      const numberOfChannels = audioBuffer.numberOfChannels
      const length = audioBuffer.length
      const sampleRate = audioBuffer.sampleRate
      const channelData = []
      
      for (let channel = 0; channel < numberOfChannels; channel++) {
        channelData.push(audioBuffer.getChannelData(channel))
      }
      
      // Create WAV file
      const wavFile = this.createWavFile(channelData, length, numberOfChannels, sampleRate)
      
      // Create a new blob with WAV format
      const wavBlob = new Blob([wavFile], { type: 'audio/wav' })
      
      // Close the audio context
      audioContext.close()
      
      return wavBlob
    } catch (error) {
      console.error('Error converting to WAV:', error)
      // Return the original blob if conversion fails
      return webmBlob
    }
  }
  
  /**
   * Create a WAV file from PCM data
   */
  private createWavFile(
    channelData: Float32Array[],
    length: number,
    numberOfChannels: number,
    sampleRate: number
  ): ArrayBuffer {
    // WAV header size
    const headerSize = 44
    
    // 16-bit audio (2 bytes per sample)
    const bytesPerSample = 2
    
    // Calculate total file size
    const dataSize = length * numberOfChannels * bytesPerSample
    const fileSize = headerSize + dataSize
    
    // Create a buffer for the WAV file
    const buffer = new ArrayBuffer(fileSize)
    const view = new DataView(buffer)
    
    // Write WAV header
    // "RIFF" chunk descriptor
    this.writeString(view, 0, 'RIFF')
    view.setUint32(4, fileSize - 8, true)
    this.writeString(view, 8, 'WAVE')
    
    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true) // fmt chunk size
    view.setUint16(20, 1, true) // PCM format
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true) // byte rate
    view.setUint16(32, numberOfChannels * bytesPerSample, true) // block align
    view.setUint16(34, bytesPerSample * 8, true) // bits per sample
    
    // "data" sub-chunk
    this.writeString(view, 36, 'data')
    view.setUint32(40, dataSize, true)
    
    // Write audio data
    let offset = headerSize
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        // Convert float to 16-bit PCM
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]))
        const pcmValue = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        view.setInt16(offset, pcmValue, true)
        offset += bytesPerSample
      }
    }
    
    return buffer
  }
  
  /**
   * Write a string to a DataView at the specified offset
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
  
  /**
   * Disconnect and clean up
   */
  dispose(): void {
    if (this.monosynth) this.monosynth.dispose()
    if (this.reverb) this.reverb.dispose()
    if (this.distortion) this.distortion.dispose()
    if (this.filter) this.filter.dispose()
    if (this.delay) this.delay.dispose()
    if (this.chorus) this.chorus.dispose()
    
    this.stopLoop()
    
    this.monosynth = null
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