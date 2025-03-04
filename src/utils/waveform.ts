import { LineSegment, WaveformPoint } from '@/types/audio'

/**
 * Checks if a point is near a line segment
 */
export function distanceToLineSegment(
  x: number, 
  y: number, 
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number
): number {
  const A = x - x1
  const B = y - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) param = dot / lenSq

  let xx, yy

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  const dx = x - xx
  const dy = y - yy
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Checks if a point is near any line in the waveform
 */
export function isPointNearLine(
  x: number, 
  y: number, 
  points: WaveformPoint[], 
  threshold = 5
): boolean {
  if (points.length < 2) return false

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    
    // Skip if this is a new line
    if (p2.isNewLine) continue
    
    const distance = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y)
    if (distance < threshold) return true
  }

  return false
}

/**
 * Find a line segment near the given coordinates
 */
export function findLineSegment(
  x: number, 
  y: number, 
  points: WaveformPoint[],
  threshold = 5
): LineSegment | null {
  if (points.length < 2) return null

  // First find which line segment is being hovered
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    
    // Skip if this is a new line
    if (p2.isNewLine) continue
    
    const distance = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y)
    
    if (distance < threshold) {
      // Once we find the hovered segment, we need to find the entire line it belongs to
      // by detecting newLine markers in both directions
      
      // Find start of line (go backward until we find a newLine or the beginning)
      let startIndex = i
      while (startIndex > 0 && !points[startIndex].isNewLine) {
        startIndex--
      }
      
      // If we found a newLine, we need to adjust the index
      if (points[startIndex].isNewLine) {
        startIndex++
      }
      
      // Find end of line (go forward until we find a newLine or the end)
      let endIndex = i + 1
      while (endIndex < points.length && !points[endIndex].isNewLine) {
        endIndex++
      }
      
      // Create a line segment with all the points in this line
      return {
        startIndex,
        endIndex: endIndex - 1, // Exclude the newLine point if there is one
        points: points.slice(startIndex, endIndex)
      }
    }
  }

  return null
}

/**
 * Apply smoothing to a line by averaging adjacent points
 */
export function smoothLine(points: WaveformPoint[]): WaveformPoint[] {
  if (points.length <= 2) return [...points]
  
  const smoothed = [...points]
  
  // Apply simple moving average smoothing
  for (let i = 1; i < points.length - 1; i++) {
    // Skip if this is a new line marker
    if (smoothed[i].isNewLine) continue
    
    // Skip if next point is a new line marker
    if (smoothed[i + 1].isNewLine) continue
    
    smoothed[i] = {
      ...smoothed[i],
      // Average x and y with neighboring points
      y: (points[i - 1].y + points[i].y + points[i + 1].y) / 3
    }
  }
  
  return smoothed
}

/**
 * Stretch a line horizontally by a factor
 */
export function stretchLine(points: WaveformPoint[], factor: number): WaveformPoint[] {
  return points.map(point => ({
    ...point,
    x: point.x * factor,
    // Adjust time proportionally
    time: point.time ? point.time * factor : 0
  }))
}

/**
 * Apply a simple arpeggio effect by duplicating points with y-offsets
 */
export function applyArpeggio(points: WaveformPoint[]): WaveformPoint[] {
  const result: WaveformPoint[] = []
  const offsets = [0, 20, -20, 40] // Y-offsets for the arpeggio pattern
  
  points.forEach((point, i) => {
    if (point.isNewLine) {
      result.push({...point})
      return
    }
    
    offsets.forEach((offset, j) => {
      result.push({
        ...point,
        x: point.x + (j * 10), // Slight x offset for each note
        y: point.y + offset,
        isNewLine: j === 0 ? point.isNewLine : false
      })
    })
  })
  
  return result
}

/**
 * Map a y-coordinate to frequency in Hz
 */
export function mapToFrequency(y: number, height: number): number {
  // Map y value (0=top to height=bottom) to frequency range (110Hz to 880Hz)
  const minFreq = 110 // A2
  const maxFreq = 880 // A5
  
  // Invert y value since canvas y increases downward
  const invertedY = height - y
  const normalizedY = invertedY / height
  
  // Apply logarithmic mapping for more natural musical intervals
  return minFreq * Math.pow(maxFreq / minFreq, normalizedY)
} 