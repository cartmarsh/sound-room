'use client'

import { SavedSound, TimelineEvent } from '@/types/audio'
import { useRef } from 'react'
import { useAudioStore } from '@/store/useAudioStore'

interface TimelineItemProps {
  event: TimelineEvent
  sound: SavedSound
  pixelsPerSecond: number
  onDragStart: () => void
}

const TimelineItem = ({
  event,
  sound,
  pixelsPerSecond,
  onDragStart,
}: TimelineItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null)
  const { updateTimelineEvent } = useAudioStore()
  
  // Position and size of the event
  const style = {
    left: `${event.startTime * pixelsPerSecond}px`,
    width: `${event.duration * pixelsPerSecond}px`,
  }
  
  // Handle resize from the right edge
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!itemRef.current) return
    
    const startX = e.clientX
    const startWidth = itemRef.current.offsetWidth
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const newWidth = Math.max(50, startWidth + delta)
      
      // Update the duration based on the new width
      const newDuration = newWidth / pixelsPerSecond
      
      updateTimelineEvent({
        ...event,
        duration: newDuration,
      })
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  
  // Determine background color based on waveform type
  const getBackgroundColor = () => {
    switch (sound.waveform) {
      case 'sine': return 'bg-blue-600'
      case 'square': return 'bg-green-600'
      case 'triangle': return 'bg-yellow-600'
      case 'sawtooth': return 'bg-red-600'
      case 'custom': return 'bg-purple-600'
      default: return 'bg-gray-600'
    }
  }
  
  return (
    <div
      ref={itemRef}
      className={`absolute top-2 bottom-2 ${getBackgroundColor()} rounded-md border border-white/20 cursor-move flex flex-col overflow-hidden`}
      style={style}
      draggable
      onDragStart={onDragStart}
    >
      <div className="p-2 bg-black/20 text-xs font-medium truncate">
        {sound.name}
      </div>
      
      <div className="flex-1 flex items-center justify-center text-xs px-2">
        {Math.round(event.duration * 10) / 10}s
      </div>
      
      {/* Resize handle on the right */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize bg-black/20 hover:bg-black/40"
        onMouseDown={handleResizeStart}
      />
    </div>
  )
}

export default TimelineItem 