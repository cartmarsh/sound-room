import { useState, useEffect } from 'react'
import { TutorialStep } from '@/components/ui/tutorial'

// Define the tutorial steps
const tutorialSteps: TutorialStep[] = [
  {
    id: 'drawing',
    title: 'Drawing Area',
    description: 'Draw your sound by clicking and dragging on this canvas. The shape you draw will determine how your sound plays.',
    targetSelector: '.waveform-canvas',
    position: 'bottom'
  },
  {
    id: 'playback',
    title: 'Playback Controls',
    description: 'Play your sound, toggle loop mode, or clear the canvas to start over.',
    targetSelector: '.playback-controls',
    position: 'top'
  },
  {
    id: 'waveform',
    title: 'Waveform Types',
    description: 'Choose different waveform types like sine, square, or triangle to change how your sound is synthesized.',
    targetSelector: '.waveform-config-panel',
    position: 'left',
    tabToActivate: 'waveform'
  },
  {
    id: 'effects',
    title: 'Sound Effects',
    description: 'Apply effects like reverb, distortion, and filters to shape your sound and create unique tones.',
    targetSelector: '.effects-panel',
    position: 'left',
    tabToActivate: 'effects'
  },
  {
    id: 'grid',
    title: 'Grid Settings',
    description: 'The current grid settings are displayed here. You can change them in the settings panel.',
    targetSelector: '.grid-settings',
    position: 'bottom',
    tabToActivate: 'grid'
  }
]

// Check if the tutorial has been shown before
const hasTutorialBeenShown = () => {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('soundroom_tutorial_shown') === 'true'
}

// Mark the tutorial as shown
const markTutorialAsShown = () => {
  if (typeof window === 'undefined') return
  localStorage.setItem('soundroom_tutorial_shown', 'true')
}

export function useTutorial() {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false)
  
  // Check if we should show the tutorial on first load
  useEffect(() => {
    // Only show the tutorial if it hasn't been shown before
    if (!hasTutorialBeenShown()) {
      // Add a small delay to ensure the app is fully loaded
      const timer = setTimeout(() => {
        setIsTutorialOpen(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [])
  
  const openTutorial = () => {
    setIsTutorialOpen(true)
  }
  
  const closeTutorial = () => {
    setIsTutorialOpen(false)
    markTutorialAsShown()
  }
  
  return {
    isTutorialOpen,
    openTutorial,
    closeTutorial,
    tutorialSteps
  }
} 