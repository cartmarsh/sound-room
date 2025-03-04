'use client'

import { useRef, useState } from 'react'
import { useAudioStore } from '@/store/useAudioStore'
import { TimelineEvent } from '@/types/audio'
import { Button } from '@/components/ui/button'
import { Play, Square } from 'lucide-react'
import audioEngine from '@/services/AudioEngine'

// Create a placeholder TimelineTrack component since the file can't be found
const TimelineTrack = ({
  trackIndex,
  height,
  events,
  savedSounds,
  pixelsPerSecond,
  onDragStart,
  onDragOver,
}: {
  trackIndex: number
  height: number
  events: TimelineEvent[]
  savedSounds: any[]
  pixelsPerSecond: number
  onDragStart: (event: TimelineEvent) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
}) => {
  return (
    <div
      className={`relative w-full border-b border-stone-700 ${trackIndex % 2 === 0 ? 'bg-stone-800' : 'bg-stone-900'}`}
      style={{ height }}
      onDragOver={onDragOver}
      onDrop={(e) => e.preventDefault()}
    >
      <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r border-stone-700">
        <span className="text-xs text-stone-400">{trackIndex + 1}</span>
      </div>
      
      <div className="absolute left-10 top-0 right-0 bottom-0">
        {events.map((event) => {
          const sound = savedSounds.find((s) => s.id === event.soundId)
          if (!sound) return null
          
          return (
            <div
              key={event.id}
              className="absolute top-2 bottom-2 bg-blue-600 rounded-md border border-white/20 cursor-move flex flex-col overflow-hidden"
              style={{
                left: `${event.startTime * pixelsPerSecond}px`,
                width: `${event.duration * pixelsPerSecond}px`,
              }}
              draggable
              onDragStart={() => onDragStart(event)}
            >
              <div className="p-2 bg-black/20 text-xs font-medium truncate">
                {sound.name}
              </div>
              
              <div className="flex-1 flex items-center justify-center text-xs px-2">
                {Math.round(event.duration * 10) / 10}s
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface TimelineProps {
  width: number
  height: number
  trackHeight?: number
  numTracks?: number
}

const Timeline = ({
  width,
  height,
  trackHeight = 80,
  numTracks = 4,
}: TimelineProps) => {
  const {
    timelineEvents,
    savedSounds,
    playheadPosition,
    isPlaying,
    setPlayheadPosition,
    setIsPlaying,
    updateTimelineEvent,
  } = useAudioStore()
  
  const timelineRef = useRef<HTMLDivElement>(null)
  const [draggedEvent, setDraggedEvent] = useState<TimelineEvent | null>(null)
  const [playheadRef, setPlayheadRef] = useState<number | null>(null)
  const pixelsPerSecond = 100 // Scaling factor for timeline
  
  // Start/stop playback
  const togglePlayback = () => {
    if (isPlaying) {
      audioEngine.stopAllSound()
      setIsPlaying(false)
      
      if (playheadRef !== null) {
        window.cancelAnimationFrame(playheadRef)
        setPlayheadRef(null)
      }
    } else {
      setIsPlaying(true)
      playTimeline()
    }
  }
  
  // Play all sounds on the timeline
  const playTimeline = async () => {
    const sortedEvents = [...timelineEvents].sort((a, b) => a.startTime - b.startTime)
    
    if (sortedEvents.length === 0) {
      setIsPlaying(false)
      return
    }
    
    // Find the sound with the latest end time to determine total duration
    const lastEndTime = sortedEvents.reduce((max, event) => {
      const endTime = event.startTime + event.duration
      return endTime > max ? endTime : max
    }, 0)
    
    // Start time for the animation
    const startTime = performance.now()
    const startPosition = playheadPosition
    
    // Animate the playhead
    const updatePlayhead = (time: number) => {
      // Calculate elapsed time
      const elapsed = (time - startTime) / 1000
      const newPosition = startPosition + elapsed
      
      // Update playhead position
      setPlayheadPosition(newPosition)
      
      // Continue animation if still playing and not reached the end
      if (newPosition <= lastEndTime) {
        const ref = window.requestAnimationFrame(updatePlayhead)
        setPlayheadRef(ref)
      } else {
        setIsPlaying(false)
      }
    }
    
    // Start the animation
    const ref = window.requestAnimationFrame(updatePlayhead)
    setPlayheadRef(ref)
    
    // Play each sound
    for (const event of sortedEvents) {
      const sound = savedSounds.find((s) => s.id === event.soundId)
      if (!sound) continue
      
      const delay = Math.max(0, event.startTime - playheadPosition)
      
      audioEngine.playSound(
        sound.points,
        sound.waveform,
        sound.effects,
        event.duration,
        delay
      )
    }
  }
  
  // Reset playhead position
  const resetPlayhead = () => {
    setPlayheadPosition(0)
  }
  
  // Handle drag start
  const handleDragStart = (event: TimelineEvent) => {
    setDraggedEvent(event)
  }
  
  // Handle drag over a track
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, trackIndex: number) => {
    e.preventDefault()
    
    if (!timelineRef.current || !draggedEvent) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    
    // Calculate new start time based on x position
    const newStartTime = Math.max(0, offsetX / pixelsPerSecond)
    
    // Update the event's position during drag
    const updatedEvent = {
      ...draggedEvent,
      startTime: newStartTime,
      track: trackIndex,
    }
    
    updateTimelineEvent(updatedEvent)
  }
  
  // Handle drag end
  const handleDragEnd = () => {
    setDraggedEvent(null)
  }
  
  // Render the playhead
  const renderPlayhead = () => {
    const playheadStyle = {
      left: `${playheadPosition * pixelsPerSecond}px`,
      height: `${numTracks * trackHeight}px`,
    }
    
    return (
      <div 
        className="absolute top-0 w-0.5 bg-red-500 z-10"
        style={playheadStyle}
      />
    )
  }
  
  // Generate tracks
  const renderTracks = () => {
    const tracks = []
    
    for (let i = 0; i < numTracks; i++) {
      const trackEvents = timelineEvents.filter((event) => event.track === i)
      
      tracks.push(
        <TimelineTrack
          key={i}
          trackIndex={i}
          height={trackHeight}
          events={trackEvents}
          savedSounds={savedSounds}
          pixelsPerSecond={pixelsPerSecond}
          onDragStart={handleDragStart}
          onDragOver={(e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, i)}
        />
      )
    }
    
    return tracks
  }
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold">Timeline</div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isPlaying ? 'destructive' : 'outline'}
            onClick={togglePlayback}
          >
            {isPlaying ? <Square className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? 'Stop' : 'Play'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetPlayhead}
          >
            Reset
          </Button>
        </div>
      </div>
      
      <div
        ref={timelineRef}
        className="relative bg-stone-900 rounded-md border border-stone-700 overflow-x-auto"
        style={{ width, height }}
        onDragEnd={handleDragEnd}
      >
        {/* Render time markers */}
        <div className="absolute top-0 left-0 h-6 border-b border-stone-700 w-full">
          {Array.from({ length: Math.ceil(width / pixelsPerSecond) }).map((_, i) => (
            <div 
              key={i} 
              className="absolute border-r border-stone-700 h-full"
              style={{ left: `${i * pixelsPerSecond}px` }}
            >
              <div className="text-xs text-stone-400 pl-1">{i}s</div>
            </div>
          ))}
        </div>
        
        {/* Track container */}
        <div className="absolute top-6 left-0 right-0 bottom-0">
          {renderTracks()}
          {renderPlayhead()}
        </div>
      </div>
    </div>
  )
}

export default Timeline 