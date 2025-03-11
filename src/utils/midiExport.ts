import MidiWriter from 'midi-writer-js'
import { WaveformPoint } from '@/types/audio'
import { mapToFrequency } from './waveform'

/**
 * Convert a note frequency to MIDI note number
 */
function frequencyToMidiNote(frequency: number): number {
  // A4 is MIDI note 69 at 440Hz
  return Math.round(12 * Math.log2(frequency / 440) + 69)
}

/**
 * Get nearest valid note name from frequency
 */
function getNoteFromFrequency(frequency: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const midiNote = frequencyToMidiNote(frequency)
  const octave = Math.floor(midiNote / 12) - 1
  const noteIndex = midiNote % 12
  
  return noteNames[noteIndex] + octave
}

/**
 * Export waveform points to a MIDI file
 */
export function exportToMIDI(points: WaveformPoint[], bpm: number = 120): Blob {
  if (points.length < 2) {
    throw new Error('Not enough points to create a MIDI file')
  }
  
  // Create a new track
  const track = new MidiWriter.Track()
  
  // Set the tempo in the MIDI file
  track.setTempo(bpm)
  
  // Process points to extract notes
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    
    // Skip if this starts a new line
    if (next.isNewLine) continue
    
    // Calculate frequency based on y coordinate (assuming canvas height of 400px)
    const frequency = mapToFrequency(current.y, 400)
    
    // Calculate note duration in ticks (assuming 480 ticks per quarter note)
    // Time is in seconds, we'll convert to quarter notes using the actual BPM
    const durationInSeconds = (next.time || 0) - (current.time || 0)
    
    // Skip very short notes
    if (durationInSeconds < 0.05) continue
    
    // At the given BPM, calculate seconds per quarter note
    const secondsPerQuarterNote = 60 / bpm
    const durationInQuarterNotes = durationInSeconds / secondsPerQuarterNote
    
    // Convert to ticks (480 ticks per quarter note)
    const durationInTicks = Math.round(480 * durationInQuarterNotes)
    
    // Create a note
    const note = new MidiWriter.NoteEvent({
      pitch: getNoteFromFrequency(frequency),
      duration: `T${durationInTicks}`,
      velocity: 100
    })
    
    // Add the note to the track
    track.addEvent(note)
  }
  
  // Create a writer with the track
  const writer = new MidiWriter.Writer([track])
  
  // Convert to a data URL and return
  return new Blob([writer.buildFile()], { type: 'audio/midi' })
}

/**
 * Save a Blob as a file for the user to download
 */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
} 