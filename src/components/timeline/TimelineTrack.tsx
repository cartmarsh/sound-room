'use client'

import { SavedSound, TimelineEvent } from '@/types/audio'
import TimelineItem from './TimelineItem'

interface TimelineTrackProps {
  trackIndex: number
  height: number
  events: TimelineEvent[]
  savedSounds: SavedSound[]
  pixelsPerSecond: number
  onDragStart: (event: TimelineEvent) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
}

const TimelineTrack = ({
  trackIndex,
  height,
  events,
  savedSounds,
  pixelsPerSecond,
  onDragStart,
  onDragOver,
}: TimelineTrackProps) => {
  return (
    <div
      className={`relative w-full border-b border-stone-700 ${trackIndex % 2 === 0 ? 'bg-stone-800' : 'bg-stone-850'}`}
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
            <TimelineItem
              key={event.id}
              event={event}
              sound={sound}
              pixelsPerSecond={pixelsPerSecond}
              onDragStart={() => onDragStart(event)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default TimelineTrack 