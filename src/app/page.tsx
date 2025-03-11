'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import WaveformCanvas from '@/components/waveform/WaveformCanvas'
import WaveConfigPanel from '@/components/waveform/WaveConfigPanel'
import Timeline from '@/components/timeline/Timeline'
import { useAudioStore } from '@/store/useAudioStore'
import { 
  Play, 
  Square, 
  Trash2, 
  Edit3, 
  Save, 
  Music, 
  Download,
  Scissors,
  ZoomIn,
  Repeat
} from 'lucide-react'
import audioEngine from '@/services/AudioEngine'
import { exportToMIDI, saveBlob } from '@/utils/midiExport'
import { smoothLine, stretchLine, applyArpeggio } from '@/utils/waveform'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'

export default function Home() {
  const [soundName, setSoundName] = useState('Sound x1')
  const [isPlaying, setIsPlaying] = useState(false)
  const [showStopButton, setShowStopButton] = useState(false)
  
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
    drawingConfig,
    setLoopMode
  } = useAudioStore()
  
  // Get loopEnabled from the store
  const loopEnabled = drawingConfig.loopMode
  
  // Play the current drawing
  const playCurrentDrawing = () => {
    if (points.length < 2) return
    
    setIsPlaying(true)
    // Only show stop button if loop is enabled
    setShowStopButton(loopEnabled)
    
    const bpm = drawingConfig.tempo
    audioEngine.playSound(
      points, 
      selectedWaveform, 
      effects, 
      undefined, 
      0, 
      bpm, 
      loopEnabled,
      // Callback when playback completes
      () => {
        setIsPlaying(false)
        setShowStopButton(false)
      }
    )
  }
  
  // Stop playback
  const stopPlayback = () => {
    setIsPlaying(false)
    setShowStopButton(false)
    audioEngine.stopAllSound()
  }
  
  // Toggle play/stop
  const handlePlayStop = () => {
    if (showStopButton && isPlaying) {
      stopPlayback()
    } else {
      playCurrentDrawing()
    }
  }
  
  // Handle loop toggle
  const handleLoopToggle = (enabled: boolean) => {
    setLoopMode(enabled)
    
    // If we're currently playing
    if (isPlaying) {
      if (enabled) {
        // If enabling loop, update UI to show stop button
        setShowStopButton(true)
      } else {
        // If disabling loop, tell the audio engine to finish current loop
        audioEngine.setLoopMode(false)
        // UI will update when the playback complete callback is called
      }
    }
  }
  
  // Stop playback when component unmounts
  useEffect(() => {
    return () => {
      audioEngine.stopAllSound()
    }
  }, [])
  
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
      const bpm = drawingConfig.tempo
      const midiBlob = exportToMIDI(points, bpm)
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
            <div className="flex justify-between items-center mb-4 header-editor-container mr-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">Waveform Editor</h2>
                <div className="px-3 py-2 bg-stone-800 border border-stone-700 rounded-md flex flex-wrap items-center gap-2">
                  {/* Waveform Settings */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">Wave:</span>
                    <span className="text-sm font-medium text-stone-200 capitalize">{selectedWaveform}</span>
                  </div>
                  <div className="h-4 w-px bg-stone-700" />
                  
                  {/* Grid Settings */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">Grid:</span>
                    <div className="flex gap-2">
                      <span className="px-1.5 py-0.5 bg-stone-900/50 border border-stone-600 rounded text-xs text-stone-300">
                        {editingState.isEditMode ? 'Edit Mode' : 'Draw Mode'}
                      </span>
                      <span className="px-1.5 py-0.5 bg-stone-900/50 border border-stone-600 rounded text-xs text-stone-300">
                        {drawingConfig.gridSize}px
                      </span>
                    </div>
                  </div>
                  <div className="h-4 w-px bg-stone-700" />
                  
                  {/* Effects */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">Effects:</span>
                    <div className="flex flex-wrap gap-1">
                      {effects.reverb > 0 && (
                        <span className="px-1.5 py-0.5 bg-violet-900/30 border border-violet-700/30 rounded text-xs text-violet-300">
                          Reverb: {effects.reverb}
                        </span>
                      )}
                      {effects.distortion > 0 && (
                        <span className="px-1.5 py-0.5 bg-violet-900/30 border border-violet-700/30 rounded text-xs text-violet-300">
                          Distortion: {effects.distortion}
                        </span>
                      )}
                      {effects.filter > 0 && (
                        <span className="px-1.5 py-0.5 bg-violet-900/30 border border-violet-700/30 rounded text-xs text-violet-300">
                          Filter: {effects.filter}
                        </span>
                      )}
                      {effects.delay > 0 && (
                        <span className="px-1.5 py-0.5 bg-violet-900/30 border border-violet-700/30 rounded text-xs text-violet-300">
                          Delay: {effects.delay}
                        </span>
                      )}
                      {effects.chorus > 0 && (
                        <span className="px-1.5 py-0.5 bg-violet-900/30 border border-violet-700/30 rounded text-xs text-violet-300">
                          Chorus: {effects.chorus}
                        </span>
                      )}
                      {effects.reverb === 0 && effects.distortion === 0 && 
                        (!effects.filter || effects.filter === 0) && 
                        (!effects.delay || effects.delay === 0) && 
                        (!effects.chorus || effects.chorus === 0) && (
                        <span className="text-sm text-stone-500 italic">None</span>
                      )}
                    </div>
                  </div>
                  
                  
                </div>
              </div>
              <div className="flex gap-2 ml-4">
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
              </div>
            </div>
            
            <WaveformCanvas width={800} height={400} />
            
            <div className="flex justify-center items-center mt-4">
              <div className="flex gap-6 px-10 items-center">
                <Button 
                  onClick={handlePlayStop}
                  className={cn(
                    "transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900",
                    showStopButton && isPlaying
                      ? "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus:ring-red-500/50"
                      : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white focus:ring-emerald-500/50"
                  )}
                >
                  {showStopButton && isPlaying ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-400">Loop</span>
                  <Switch
                    checked={loopEnabled}
                    onCheckedChange={handleLoopToggle}
                    className={cn(
                      "data-[state=checked]:bg-emerald-600",
                      "data-[state=unchecked]:bg-stone-700"
                    )}
                  />
                </div>
                
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    stopPlayback()
                    clearPoints()
                  }}
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
                          // Stop any current playback
                          if (isPlaying) {
                            stopPlayback()
                          }
                          // Play this sound
                          setIsPlaying(true)
                          setShowStopButton(loopEnabled)
                          
                          audioEngine.playSound(
                            sound.points, 
                            sound.waveform, 
                            sound.effects, 
                            undefined, 
                            0, 
                            drawingConfig.tempo, 
                            loopEnabled,
                            // Callback when playback completes
                            () => {
                              setIsPlaying(false)
                              setShowStopButton(false)
                            }
                          )
                        }}
                        className="text-stone-400 hover:text-emerald-400 hover:bg-emerald-950/30 active:bg-emerald-950/40 transition-all
                                   focus:ring-2 focus:ring-emerald-500/30 rounded-full"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          const bpm = drawingConfig.tempo
                          audioEngine.downloadSoundAsAudio(
                            sound.points, 
                            sound.waveform, 
                            sound.effects, 
                            undefined, 
                            `${sound.name.replace(/\s+/g, '-').toLowerCase()}.wav`,
                            bpm
                          )
                        }}
                        className="text-stone-400 hover:text-blue-400 hover:bg-blue-950/30 active:bg-blue-950/40 transition-all
                                   focus:ring-2 focus:ring-blue-500/30 rounded-full"
                        title="Download as WAV"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
