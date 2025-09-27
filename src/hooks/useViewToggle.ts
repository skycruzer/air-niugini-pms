'use client'

import { useState, useEffect } from 'react'

export type ViewMode = 'grid' | 'list'

export function useViewToggle(storageKey: string = 'pilot-view-mode', defaultView: ViewMode = 'grid') {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load saved view preference from localStorage
    try {
      const savedView = localStorage.getItem(storageKey)
      if (savedView && (savedView === 'grid' || savedView === 'list')) {
        setViewMode(savedView as ViewMode)
      }
    } catch (error) {
      console.warn('Failed to load view preference from localStorage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [storageKey])

  const toggleView = () => {
    const newView: ViewMode = viewMode === 'grid' ? 'list' : 'grid'
    setViewMode(newView)

    // Save to localStorage
    try {
      localStorage.setItem(storageKey, newView)
    } catch (error) {
      console.warn('Failed to save view preference to localStorage:', error)
    }
  }

  const setView = (mode: ViewMode) => {
    setViewMode(mode)

    // Save to localStorage
    try {
      localStorage.setItem(storageKey, mode)
    } catch (error) {
      console.warn('Failed to save view preference to localStorage:', error)
    }
  }

  return {
    viewMode,
    isLoading,
    toggleView,
    setView,
    isGridView: viewMode === 'grid',
    isListView: viewMode === 'list'
  }
}