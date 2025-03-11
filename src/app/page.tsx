'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import WaveformCanvas from '@/components/waveform/WaveformCanvas'
import WaveConfigPanel from '@/components/waveform/WaveConfigPanel'
import Timeline from '@/components/timeline/Timeline'
import { useAudioStore } from '@/store/useAudioStore'
import { 
  Play, 
  Save, 
  Trash2, 
  Download, 
  Edit3, 
  Scissors, 
  ZoomIn 
} from 'lucide-react'
import audioEngine from '@/services/AudioEngine'
import { exportToMIDI, saveBlob } from '@/utils/midiExport'
import { smoothLine, stretchLine, applyArpeggio } from '@/utils/waveform'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function Home() {
  const [soundName, setSoundName] = useState('Sound 1')
  
  const {
    points,
    clearPoints,
    savedSounds,
    saveSound,
    editingState,
    updateEditingState,
    setPoints,
    selectedWaveform,
    effects,
    isPlaying
  } = useAudioStore()
  
  // Play the current drawing
  const playCurrentDrawing = () => {
    if (points.length < 2) return
    
    audioEngine.playSound(points, selectedWaveform, effects)
  }
  
  // Save the current drawing
  const handleSaveSound = () => {
    if (points.length < 2) return
    
    saveSound(soundName)
    
    // Generate next sound name
    const nextNumber = (savedSounds.length + 1)
    setSoundName(`Sound ${nextNumber}`)
  }
  
  // Export to MIDI
  const handleExportMIDI = () => {
    if (points.length < 2) return
    
    try {
      const midiBlob = exportToMIDI(points)
      saveBlob(midiBlob, `${soundName}.mid`)
    } catch (error) {
      console.error('Failed to export MIDI:', error)
    }
  }
  
  // Toggle edit mode
  const toggleEditMode = () => {
    updateEditingState({ isEditMode: !editingState.isEditMode })
  }
  
  // Apply effects to the selected segment or entire drawing
  const applyEffect = (effect: 'smooth' | 'stretch' | 'arpeggio') => {
    if (editingState.selectedSegment) {
      // Apply to selected segment
      const segment = editingState.selectedSegment
      const newPoints = [...points]
      
      let processed = [...segment.points]
      
      if (effect === 'smooth') {
        processed = smoothLine(processed)
      } else if (effect === 'stretch') {
        processed = stretchLine(processed, 1.5)
      } else if (effect === 'arpeggio') {
        processed = applyArpeggio(processed)
      }
      
      // Replace segment in the full points array
      newPoints.splice(segment.startIndex, segment.points.length, ...processed)
      
      setPoints(newPoints)
      updateEditingState({ selectedSegment: null })
      
    } else if (points.length > 0) {
      // Apply to entire drawing
      let processed = [...points]
      
      if (effect === 'smooth') {
        processed = smoothLine(processed)
      } else if (effect === 'stretch') {
        processed = stretchLine(processed, 1.5)
      } else if (effect === 'arpeggio') {
        processed = applyArpeggio(processed)
      }
      
      setPoints(processed)
    }
  }
  
  return (
    <main className="flex min-h-screen flex-col bg-stone-950 text-white p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">SoundRoom</h1>
        <p className="text-stone-400">A digital audio workstation for creating and arranging sounds</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-stone-900 rounded-md border border-stone-700 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Waveform Editor</h2>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={editingState.isEditMode ? 'secondary' : 'outline'} 
                  onClick={toggleEditMode}
                  className={cn(
                    "transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900",
                    editingState.isEditMode 
                      ? "bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white focus:ring-violet-500/50" 
                      : "border-stone-600 text-stone-300 hover:bg-stone-800 hover:text-white active:bg-stone-700 focus:ring-stone-500/50"
                  )}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {editingState.isEditMode ? 'Exit Edit' : 'Edit Mode'}
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => applyEffect('smooth')}
                  className="border-stone-600 text-stone-300 hover:bg-stone-800 hover:text-white active:bg-stone-700 transition-colors
                             focus:ring-2 focus:ring-stone-500/50 focus:ring-offset-2 focus:ring-offset-stone-900"
                >
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Smooth
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => applyEffect('stretch')}
                  className="border-stone-600 text-stone-300 hover:bg-stone-800 hover:text-white active:bg-stone-700 transition-colors
                             focus:ring-2 focus:ring-stone-500/50 focus:ring-offset-2 focus:ring-offset-stone-900"
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  Stretch
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => applyEffect('arpeggio')}
                  className="border-stone-600 text-stone-300 hover:bg-stone-800 hover:text-white active:bg-stone-700 transition-colors
                             focus:ring-2 focus:ring-stone-500/50 focus:ring-offset-2 focus:ring-offset-stone-900"
                >
                  Arpeggio
                </Button>
              </div>
            </div>
            
            <WaveformCanvas width={800} height={400} />
            
            <div className="flex justify-center items-center mt-4">
              <div className="flex gap-6 px-10">
                <Button 
                  onClick={playCurrentDrawing}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-colors
                             focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-stone-900"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={clearPoints}
                  className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition-colors
                             focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-stone-900"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
              
              <div className="flex gap-2 items-center">
                <Input
                  className="w-48 text-stone-800"
                  value={soundName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSoundName(e.target.value)}
                  placeholder="Sound name"
                />
                
                <Button 
                  onClick={handleSaveSound}
                  className="bg-primary hover:bg-primary/90 active:bg-primary/80 text-white transition-colors
                             focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-stone-900"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleExportMIDI}
                  className="border-stone-600 text-stone-300 hover:bg-stone-800 hover:text-white active:bg-stone-700 transition-colors
                             focus:ring-2 focus:ring-stone-500/50 focus:ring-offset-2 focus:ring-offset-stone-900"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export MIDI
                </Button>
              </div>
            </div>
          </div>
          
          <Timeline width={800} height={300} />
        </div>
        
        {/* Right panel */}
        <div className="flex flex-col gap-4">
          <WaveConfigPanel />
          
          <div className="bg-stone-900 border border-stone-700 rounded-md p-4">
            <h3 className="text-lg font-semibold mb-4">Saved Sounds</h3>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {savedSounds.length === 0 ? (
                <div className="text-stone-500 text-sm italic">No saved sounds yet</div>
              ) : (
                savedSounds.map((sound) => (
                  <div 
                    key={sound.id}
                    className="p-2 bg-stone-800 rounded flex justify-between items-center"
                  >
                    <span>{sound.name}</span>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          audioEngine.playSound(sound.points, sound.waveform, sound.effects)
                        }}
                        className="text-stone-400 hover:text-emerald-400 hover:bg-emerald-950/30 active:bg-emerald-950/40 transition-all
                                   focus:ring-2 focus:ring-emerald-500/30 rounded-full"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 my-4">
        {/* <button
          onClick={handleStop}
          className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 disabled:opacity-50"
          disabled={!isPlaying}
          aria-label="Stop"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button> */}
        
        {/* <button
          onClick={handlePlayPause}
          className="p-4 rounded-full bg-primary text-white hover:bg-primary/90 active:bg-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        
        <button
          onClick={handleRecord}
          className={`p-3 rounded-full text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-600/50'
              : 'bg-neutral-700 hover:bg-neutral-800 active:bg-neutral-900 focus:ring-neutral-700/50'
          }`}
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="6" fill={isRecording ? "currentColor" : "none"} strokeWidth={2} />
          </svg>
        </button> */}
      </div>
    </main>
  )
}
