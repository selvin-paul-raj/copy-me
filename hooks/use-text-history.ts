"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface UseTextHistoryResult {
  text: string
  setTextWithHistory: (newText: string) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  resetHistory: (initialText: string) => void
}

const MAX_HISTORY_SIZE = 100 // Limit history size to prevent excessive memory usage

export function useTextHistory(initialText = ""): UseTextHistoryResult {
  const [history, setHistory] = useState<string[]>([initialText])
  const [currentIndex, setCurrentIndex] = useState(0)
  const isUpdatingRef = useRef(false) // To prevent history updates during undo/redo

  useEffect(() => {
    // When initialText changes (e.g., switching notebooks), reset history
    if (history[currentIndex] !== initialText && !isUpdatingRef.current) {
      setHistory([initialText])
      setCurrentIndex(0)
    }
  }, [initialText]) // Only re-run if initialText changes

  const setTextWithHistory = useCallback(
    (newText: string) => {
      if (isUpdatingRef.current) {
        // If we are in the middle of an undo/redo, don't add to history
        return
      }

      if (newText === history[currentIndex]) {
        // No change, no need to add to history
        return
      }

      const newHistory = history.slice(0, currentIndex + 1)
      newHistory.push(newText)

      // Trim history if it exceeds max size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift() // Remove the oldest entry
      }

      setHistory(newHistory)
      setCurrentIndex(newHistory.length - 1)
    },
    [history, currentIndex],
  )

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUpdatingRef.current = true
      setCurrentIndex((prev) => prev - 1)
      // Text will be updated by the useEffect in the consuming component
    }
  }, [currentIndex])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUpdatingRef.current = true
      setCurrentIndex((prev) => prev + 1)
      // Text will be updated by the useEffect in the consuming component
    }
  }, [currentIndex, history.length])

  const resetHistory = useCallback((newInitialText: string) => {
    setHistory([newInitialText])
    setCurrentIndex(0)
  }, [])

  // Effect to update the 'text' state in the consuming component when currentIndex changes
  // This is crucial because the consuming component (page.tsx) needs to react to history changes
  useEffect(() => {
    if (history[currentIndex] !== undefined) {
      // Only update if the text is different to avoid infinite loops with setTextWithHistory
      // and ensure the external 'text' state reflects the history.
      // The consuming component will then call setTextWithHistory if the user types.
      // This is a bit tricky, but necessary for the external state to follow the internal history.
      // The `isUpdatingRef` helps prevent re-adding to history when this effect runs.
      if (isUpdatingRef.current) {
        // If this update is due to undo/redo, reset the flag after a short delay
        // to allow the next user input to be recorded.
        const timer = setTimeout(() => {
          isUpdatingRef.current = false
        }, 0) // Small delay to ensure the current render cycle completes
        return () => clearTimeout(timer)
      }
    }
  }, [currentIndex, history])

  return {
    text: history[currentIndex],
    setTextWithHistory,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    resetHistory,
  }
}
