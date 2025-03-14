'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TutorialStep {
  id: string
  title: string
  description: string
  targetSelector: string
  position?: 'top' | 'right' | 'bottom' | 'left'
  tabToActivate?: string
}

interface TutorialProps {
  steps: TutorialStep[]
  isOpen: boolean
  onClose: () => void
}

export function Tutorial({ steps, isOpen, onClose }: TutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [targetElement, setTargetElement] = useState<DOMRect | null>(null)
  
  const currentStep = steps[currentStepIndex]
  
  // Find and highlight the target element when the step changes
  useEffect(() => {
    if (!isOpen || !currentStep) return
    
    // Reset target element when changing steps
    setTargetElement(null)
    
    // If this step requires activating a specific tab, do it first
    if (currentStep.tabToActivate) {
      // Find the tab container
      const tabsContainer = document.querySelector('.rounded-md.bg-stone-900.border.border-stone-700')
      if (tabsContainer) {
        // Find the tab trigger by its value attribute
        const tabTrigger = tabsContainer.querySelector(`[value="${currentStep.tabToActivate}"]`) as HTMLElement
        
        if (tabTrigger) {
          // Click the tab trigger to activate it
          tabTrigger.click()
          
          // Add a small delay to allow the tab content to become visible
          setTimeout(() => {
            const target = document.querySelector(currentStep.targetSelector)
            if (target) {
              const rect = target.getBoundingClientRect()
              setTargetElement(rect)
            } else {
              console.error(`Target element not found: ${currentStep.targetSelector}`)
            }
          }, 300)
          
          return
        }
      }
    }
    
    // Normal target finding without tab switching
    const target = document.querySelector(currentStep.targetSelector)
    if (target) {
      const rect = target.getBoundingClientRect()
      setTargetElement(rect)
    } else {
      console.error(`Target element not found: ${currentStep.targetSelector}`)
    }
    
    // Add a small delay to ensure the DOM has updated
    const timer = setTimeout(() => {
      const updatedTarget = document.querySelector(currentStep.targetSelector)
      if (updatedTarget) {
        const rect = updatedTarget.getBoundingClientRect()
        setTargetElement(rect)
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [currentStep, currentStepIndex, isOpen])
  
  if (!isOpen || !currentStep) return null
  
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      onClose()
    }
  }
  
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }
  
  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetElement) return { top: '50%', left: '50%' }
    
    const position = currentStep.position || 'bottom'
    const padding = 20 // Space between target and tooltip
    
    switch (position) {
      case 'top':
        return {
          top: `${targetElement.top - padding}px`,
          left: `${targetElement.left + targetElement.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        }
      case 'right':
        return {
          top: `${targetElement.top + targetElement.height / 2}px`,
          left: `${targetElement.right + padding}px`,
          transform: 'translate(0, -50%)'
        }
      case 'bottom':
        return {
          top: `${targetElement.bottom + padding}px`,
          left: `${targetElement.left + targetElement.width / 2}px`,
          transform: 'translate(-50%, 0)'
        }
      case 'left':
        return {
          top: `${targetElement.top + targetElement.height / 2}px`,
          left: `${targetElement.left - padding}px`,
          transform: 'translate(-100%, -50%)'
        }
      default:
        return {
          top: `${targetElement.bottom + padding}px`,
          left: `${targetElement.left + targetElement.width / 2}px`,
          transform: 'translate(-50%, 0)'
        }
    }
  }
  
  const tooltipPosition = getTooltipPosition()
  
  // Tutorial theme color
  const tutorialColor = {
    primary: '#6366f1', // Indigo color
    border: 'rgba(99, 102, 241, 0.9)',
    glow: 'rgba(99, 102, 241, 0.5)',
    overlay: 'rgba(0, 0, 0, 0.8)'
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay with spotlight effect */}
      <div className="absolute inset-0" style={{ backgroundColor: tutorialColor.overlay }} />
      
      {/* Spotlight on target element */}
      {targetElement && (
        <div 
          className="absolute bg-transparent pointer-events-none z-10"
          style={{
            top: targetElement.top - 15 + 'px',
            left: targetElement.left - 15 + 'px',
            width: targetElement.width + 30 + 'px',
            height: targetElement.height + 30 + 'px',
            boxShadow: `0 0 0 9999px ${tutorialColor.overlay}`,
            borderRadius: '10px',
            border: `4px solid ${tutorialColor.border}`,
            animation: 'pulse-border 1.5s infinite',
          }}
        >
          {/* Inner glow effect */}
          <div 
            className="absolute inset-0"
            style={{
              boxShadow: `inset 0 0 30px ${tutorialColor.glow}, 0 0 30px ${tutorialColor.glow}`,
              borderRadius: '7px',
              animation: 'pulse-glow 1.5s infinite alternate',
            }}
          />
        </div>
      )}
      
      {/* Tooltip */}
      <div 
        className="absolute z-20 bg-stone-800 rounded-lg p-4 shadow-lg max-w-xs"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: tooltipPosition.transform,
          border: `2px solid ${tutorialColor.border}`,
          boxShadow: `0 0 20px ${tutorialColor.glow}`,
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-white">{currentStep.title}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 rounded-full text-stone-400 hover:text-white hover:bg-stone-700"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-stone-300 mb-4">{currentStep.description}</p>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-stone-400">
            {currentStepIndex + 1} of {steps.length}
          </div>
          
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePrevious}
                className="border-stone-600 text-stone-300 hover:bg-stone-700 hover:text-white"
              >
                Previous
              </Button>
            )}
            
            <Button 
              size="sm"
              onClick={handleNext}
              style={{ backgroundColor: tutorialColor.primary }}
              className="hover:bg-opacity-90"
            >
              {currentStepIndex < steps.length - 1 ? 'Next' : 'Finish'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Add CSS animations for the pulse effects */}
      <style jsx global>{`
        @keyframes pulse-border {
          0% {
            box-shadow: 0 0 0 9999px ${tutorialColor.overlay};
            border-color: ${tutorialColor.border};
          }
          50% {
            box-shadow: 0 0 0 9999px ${tutorialColor.overlay};
            border-color: rgba(255, 255, 255, 0.9);
          }
          100% {
            box-shadow: 0 0 0 9999px ${tutorialColor.overlay};
            border-color: ${tutorialColor.border};
          }
        }
        
        @keyframes pulse-glow {
          0% {
            box-shadow: inset 0 0 20px ${tutorialColor.glow}, 0 0 20px ${tutorialColor.glow};
          }
          100% {
            box-shadow: inset 0 0 40px ${tutorialColor.glow}, 0 0 40px ${tutorialColor.glow};
          }
        }
      `}</style>
    </div>
  )
} 