'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useAudioStore } from '@/store/useAudioStore'
import { findLineSegment } from '@/utils/waveform'
import { LineSegment, WaveformPoint } from '@/types/audio'

interface WaveformCanvasProps {
  width: number
  height: number
  gridSize?: number
}

const WaveformCanvas = ({ 
  width, 
  height, 
  gridSize = 20 
}: WaveformCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [/* mousePos */, setMousePos] = useState({ x: 0, y: 0 })
  
  const {
    points,
    isDrawing,
    setIsDrawing,
    addPoint,
    drawingConfig,
    editingState,
    updateEditingState,
  } = useAudioStore()
  
  // Draw grid lines
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    
    // Draw vertical grid lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
    }
    
    ctx.stroke()
  }, [width, height, gridSize])
  
  // Draw waveform points and lines
  const drawWaveform = useCallback((
    ctx: CanvasRenderingContext2D, 
    points: WaveformPoint[], 
    hoveredSegment: LineSegment | null = null
  ) => {
    if (points.length === 0) return
    
    // First pass to draw lines
    let currentLine: WaveformPoint[] = []
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      
      // Start a new line if this point is a new line marker or it's the first point
      if (i === 0 || point.isNewLine) {
        // Draw the previous line if it has points
        if (currentLine.length > 0) {
          // Check if this line is hovered
          const isHovered = !!hoveredSegment && 
            hoveredSegment.startIndex <= i - currentLine.length &&
            hoveredSegment.endIndex >= i - 1
            
          drawLine(ctx, currentLine, isHovered)
        }
        
        // Start a new line
        currentLine = [point]
      } else {
        // Add point to current line
        currentLine.push(point)
      }
    }
    
    // Draw the last line
    if (currentLine.length > 0) {
      const startIndex = points.length - currentLine.length
      const isHovered = !!hoveredSegment && 
        hoveredSegment.startIndex <= startIndex &&
        hoveredSegment.endIndex >= points.length - 1
        
      drawLine(ctx, currentLine, isHovered)
    }
    
    // Second pass to draw points
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      
      const isHovered = !!hoveredSegment && 
        i >= hoveredSegment.startIndex && i <= hoveredSegment.endIndex
        
      drawPoint(ctx, point.x, point.y, isHovered)
    }
  }, [])
  
  // Draw waveform whenever points or hover state changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Draw grid if enabled
    if (drawingConfig.snapToGrid) {
      drawGrid(ctx)
    }
    
    // Draw existing waveform
    drawWaveform(ctx, points, editingState.hoveredSegment)
    
  }, [points, width, height, drawingConfig.snapToGrid, editingState.hoveredSegment, drawGrid, drawWaveform])
  
  // Draw a line connecting points
  const drawLine = (
    ctx: CanvasRenderingContext2D, 
    points: WaveformPoint[], 
    isHovered: boolean
  ) => {
    if (points.length < 2) return
    
    // Draw outer glow for hover effect
    if (isHovered) {
      ctx.beginPath()
      ctx.lineWidth = 7
      ctx.strokeStyle = 'rgba(30, 136, 229, 0.3)'
      
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      
      ctx.stroke()
    }
    
    // Draw main line
    ctx.beginPath()
    ctx.lineWidth = isHovered ? 3 : 2
    ctx.strokeStyle = isHovered ? '#2196F3' : '#BBBBBB'
    
    ctx.moveTo(points[0].x, points[0].y)
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    
    ctx.stroke()
  }
  
  // Draw a point
  const drawPoint = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    isHovered = false
  ) => {
    // Draw outer glow for hover effect
    if (isHovered) {
      ctx.beginPath()
      ctx.fillStyle = 'rgba(30, 136, 229, 0.3)'
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Draw main point
    ctx.beginPath()
    ctx.fillStyle = isHovered ? '#2196F3' : '#BBBBBB'
    ctx.arc(x, y, isHovered ? 6 : 4, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw inner highlight
    ctx.beginPath()
    ctx.fillStyle = isHovered ? '#90CAF9' : '#DDDDDD'
    ctx.arc(x, y, isHovered ? 3 : 2, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // Get adjusted coordinates for drawing
  const getScaledCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number, y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top
    
    // Snap to grid if enabled
    if (drawingConfig.snapToGrid) {
      x = Math.round(x / drawingConfig.gridSize) * drawingConfig.gridSize
      y = Math.round(y / drawingConfig.gridSize) * drawingConfig.gridSize
    }
    
    return { x, y }
  }
  
  // Handle mouse down event
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // In edit mode, check if we're clicking on a line
    if (editingState.isEditMode) {
      const { x, y } = getScaledCoordinates(e)
      const segment = findLineSegment(x, y, points)
      
      if (segment) {
        // Select this segment
        updateEditingState({ 
          selectedSegment: segment,
          tooltipPosition: { x, y } 
        })
        return
      }
    }
    
    // In draw mode, start drawing
    const coords = getScaledCoordinates(e)
    setIsMouseDown(true)
    setMousePos(coords)
    
    // Add the first point
    const newPoint: WaveformPoint = {
      x: coords.x,
      y: coords.y,
      time: 0,
      isNewLine: points.length > 0 ? true : undefined,
      gapDuration: points.length > 0 ? 0.2 : undefined // Default gap duration
    }
    
    addPoint(newPoint)
    setIsDrawing(true)
  }
  
  // Handle mouse move event
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getScaledCoordinates(e)
    setMousePos(coords)
    
    // In edit mode, check for hovering over lines
    if (editingState.isEditMode) {
      const segment = findLineSegment(coords.x, coords.y, points)
      
      if (segment !== editingState.hoveredSegment) {
        updateEditingState({ hoveredSegment: segment })
      }
      
      return
    }
    
    // In draw mode, add points as we drag
    if (isMouseDown && isDrawing) {
      // Only add a point if it's different from the last one
      // This prevents adding too many points when not moving much
      const lastPoint = points[points.length - 1]
      
      if (!lastPoint || 
          Math.abs(lastPoint.x - coords.x) > 5 || 
          Math.abs(lastPoint.y - coords.y) > 5) {
        
        const newPoint: WaveformPoint = {
          x: coords.x,
          y: coords.y,
          time: 0 // Will be calculated when played
        }
        
        addPoint(newPoint)
      }
    }
  }
  
  // Handle mouse up event
  const handleMouseUp = () => {
    setIsMouseDown(false)
    setIsDrawing(false)
  }
  
  return (
    <div className="relative flex justify-center items-center w-full rounded-sm overflow-hidden border border-stone-700">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="bg-stone-900 border border-stone-700"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  )
}

export default WaveformCanvas 