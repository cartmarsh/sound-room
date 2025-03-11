'use client'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Toggle } from '@/components/ui/toggle'
import { useAudioStore } from '@/store/useAudioStore'
import { WaveformType } from '@/types/audio'
import { Square, Triangle, Waves, ZapOff, Sliders, Grid } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const WaveConfigPanel = () => {
  const {
    selectedWaveform,
    setSelectedWaveform,
    effects,
    setEffect,
    drawingConfig,
    setDrawingConfig,
  } = useAudioStore()
  
  const waveforms: { type: WaveformType; label: string; icon: React.ReactNode }[] = [
    {
      type: 'sine',
      label: 'Sine',
      icon: <Waves className="h-4 w-4" />,
    },
    {
      type: 'square',
      label: 'Square',
      icon: <Square className="h-4 w-4" />,
    },
    {
      type: 'triangle',
      label: 'Triangle',
      icon: <Triangle className="h-4 w-4" />,
    },
    {
      type: 'sawtooth',
      label: 'Sawtooth',
      icon: <ZapOff className="h-4 w-4" />,
    },
    {
      type: 'custom',
      label: 'Custom',
      icon: <Sliders className="h-4 w-4" />,
    },
  ]
  
  const drawWaveformPreview = (type: WaveformType, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const width = canvas.width
    const height = canvas.height
    const centerY = height / 2
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Set line style
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    
    // Draw based on waveform type
    ctx.beginPath()
    ctx.moveTo(0, centerY)
    
    switch (type) {
      case 'sine':
        for (let x = 0; x < width; x++) {
          const y = centerY - Math.sin(x * 0.1) * (height * 0.4)
          ctx.lineTo(x, y)
        }
        break
      case 'square':
        for (let x = 0; x < width; x += width / 4) {
          ctx.lineTo(x, centerY - height * 0.4)
          ctx.lineTo(x, centerY - height * 0.4)
          ctx.lineTo(x + width / 4, centerY - height * 0.4)
          ctx.lineTo(x + width / 4, centerY + height * 0.4)
          if (x + width / 2 < width) {
            ctx.lineTo(x + width / 2, centerY + height * 0.4)
          }
        }
        break
      case 'triangle':
        ctx.lineTo(width / 4, centerY - height * 0.4)
        ctx.lineTo(width * 3 / 4, centerY + height * 0.4)
        ctx.lineTo(width, centerY)
        break
      case 'sawtooth':
        for (let x = 0; x < width; x += width / 2) {
          ctx.lineTo(x, centerY - height * 0.4)
          ctx.lineTo(x, centerY + height * 0.4)
          ctx.lineTo(x + width / 2, centerY - height * 0.4)
        }
        break
      case 'custom':
        ctx.lineTo(width * 0.2, centerY + height * 0.3)
        ctx.lineTo(width * 0.3, centerY - height * 0.4)
        ctx.lineTo(width * 0.5, centerY + height * 0.1)
        ctx.lineTo(width * 0.7, centerY - height * 0.2)
        ctx.lineTo(width * 0.9, centerY + height * 0.3)
        ctx.lineTo(width, centerY)
        break
    }
    
    ctx.stroke()
  }

  useEffect(() => {
    const canvas = document.getElementById('waveform-preview') as HTMLCanvasElement
    if (canvas) {
      drawWaveformPreview(selectedWaveform, canvas)
    }
  }, [selectedWaveform])
  
  return (
    <div className="rounded-md bg-stone-900 border border-stone-700 p-4 flex flex-col gap-4">
      <Tabs defaultValue="waveform" className="w-full">
        <TabsList className="w-full flex mb-4 rounded-md p-1 space-x-1 bg-transparent">
          {['waveform', 'effects', 'grid'].map((tab) => (
            <TabsTrigger 
              key={tab} 
              value={tab}
              className={cn(
                "relative py-1.5 px-1 rounded-md transition-all duration-200 flex-grow",
                "data-[state=active]:bg-primary/90 data-[state=active]:text-white",
                "data-[state=inactive]:bg-transparent data-[state=inactive]:text-stone-300",
                "data-[state=active]:shadow-md data-[state=inactive]:hover:bg-stone-800/30",
                "data-[state=active]:hover:bg-primary/90 data-[state=active]:font-medium",
                "border-b-2 border-transparent data-[state=active]:border-white text-sm",
                tab === 'waveform' ? "flex-grow-[1.2]" : ""
              )}
            >
              <span className="flex items-center justify-center gap-1">
                {tab === 'waveform' && <Waves className="h-3 w-3" />}
                {tab === 'effects' && <Sliders className="h-3 w-3" />}
                {tab === 'grid' && <Grid className="h-3 w-3" />}
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="waveform" className="space-y-4">
          <div>
            <div className="text-sm text-stone-200 mb-2">Waveform Type</div>
            <div className="flex flex-wrap gap-2">
              {waveforms.map((waveform) => (
                <Button
                  key={waveform.type}
                  variant={selectedWaveform === waveform.type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWaveform(waveform.type)}
                  className={cn(
                    "flex items-center gap-2 transition-all",
                    selectedWaveform === waveform.type 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80" 
                      : "hover:bg-stone-800 hover:border-stone-600 active:bg-stone-700"
                  )}
                >
                  {waveform.icon}
                  <span>{waveform.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Waveform Preview */}
          <div className="mt-4">
            <div className="text-sm text-stone-200 mb-2">Waveform Preview</div>
            <div className="bg-stone-800 rounded-md p-2 border border-stone-700">
              <canvas 
                id="waveform-preview" 
                width={300} 
                height={80} 
                className="w-full"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="effects" className="space-y-4">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-stone-200 mb-2">Reverb</div>
              <Slider
                value={[effects.reverb]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => setEffect('reverb', value[0])}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>Dry</span>
                <span>Wet</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-stone-200 mb-2">Distortion</div>
              <Slider
                value={[effects.distortion]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => setEffect('distortion', value[0])}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>Clean</span>
                <span>Drive</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-stone-200 mb-2">Filter Frequency</div>
              <Slider
                value={[effects.filter || 2000]}
                min={20}
                max={20000}
                step={100}
                onValueChange={(value) => setEffect('filter', value[0])}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-stone-200 mb-2">Delay</div>
              <Slider
                value={[effects.delay || 0.1]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => setEffect('delay', value[0])}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>None</span>
                <span>Full</span>
              </div>
            </div>

            <div>
              <div className="text-sm text-stone-200 mb-2">Chorus</div>
              <Slider
                value={[effects.chorus || 0.1]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => setEffect('chorus', value[0])}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>None</span>
                <span>Full</span>
              </div>
            </div>
            
            {/* Current Settings Summary */}
            <div className="mt-6 p-3 bg-stone-800 rounded-md border border-stone-700 text-xs text-stone-300">
              <p><span className="font-semibold">Current Waveform:</span> {selectedWaveform}</p>
              <p><span className="font-semibold">Reverb:</span> {Math.round(effects.reverb * 100)}%</p>
              <p><span className="font-semibold">Distortion:</span> {Math.round(effects.distortion * 100)}%</p>
              <p><span className="font-semibold">Filter:</span> {Math.round(effects.filter || 2000)}Hz</p>
              <p><span className="font-semibold">Delay:</span> {Math.round((effects.delay || 0.1) * 100)}%</p>
              <p><span className="font-semibold">Chorus:</span> {Math.round((effects.chorus || 0.1) * 100)}%</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="grid" className="space-y-4">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-stone-200 mb-2">Grid Size</div>
              <Slider
                value={[drawingConfig.gridSize]}
                min={5}
                max={40}
                step={5}
                onValueChange={(value) => 
                  setDrawingConfig({ gridSize: value[0] })
                }
              />
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-stone-200 mb-2">Drawing Options</div>
              <div className="flex gap-2 flex-wrap">
                <Toggle
                  pressed={drawingConfig.snapToGrid}
                  onPressedChange={(pressed) => 
                    setDrawingConfig({ snapToGrid: pressed })
                  }
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 transition-all",
                    drawingConfig.snapToGrid 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80" 
                      : "hover:bg-stone-800 hover:border-stone-600 active:bg-stone-700"
                  )}
                >
                  <Grid className="h-4 w-4" />
                  <span>Snap to Grid</span>
                </Toggle>
                
                <Toggle
                  pressed={drawingConfig.autoConnect}
                  onPressedChange={(pressed) => 
                    setDrawingConfig({ autoConnect: pressed })
                  }
                  size="sm"
                  className={cn(
                    "transition-all",
                    drawingConfig.autoConnect 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80" 
                      : "hover:bg-stone-800 hover:border-stone-600 active:bg-stone-700"
                  )}
                >
                  Auto Connect
                </Toggle>
                
                <Toggle
                  pressed={drawingConfig.loopMode}
                  onPressedChange={(pressed) => 
                    setDrawingConfig({ loopMode: pressed })
                  }
                  size="sm"
                  className={cn(
                    "transition-all",
                    drawingConfig.loopMode 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80" 
                      : "hover:bg-stone-800 hover:border-stone-600 active:bg-stone-700"
                  )}
                >
                  Loop Mode
                </Toggle>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-stone-200 mb-2">Tempo (BPM)</div>
              <Slider
                value={[drawingConfig.tempo]}
                min={60}
                max={200}
                step={1}
                onValueChange={(value) => 
                  setDrawingConfig({ tempo: value[0] })
                }
              />
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default WaveConfigPanel 