"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface UseTextHistoryResult {
  text: string
  setText: (newText: string) => void // Renamed to setText for clarity, it will manage history internally
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
  const ignoreNextSetText = useRef(false) // Flag to ignore adding to history during undo/redo

  // Effect to initialize/reset history when initialText changes (e.g., notebook switch)
  useEffect(() => {
    // Only reset if the current history state is different from the new initialText
    // This prevents resetting history if the user is typing and the initialText prop
    // is updated with the same content that's already in the history.
    if (history[currentIndex] !== initialText) {
      setHistory([initialText])
      setCurrentIndex(0)
    }
  }, [initialText]) // Depend only on initialText

  const setText = useCallback(
    (newText: string) => {
      if (ignoreNextSetText.current) {
        ignoreNextSetText.current = false // Reset flag after consuming the ignore
        return // Do not add to history if this call is from undo/redo
      }

      if (newText === history[currentIndex]) {
        return // No actual change, don't add to history
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
      ignoreNextSetText.current = true // Set flag to prevent adding to history
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      ignoreNextSetText.current = true // Set flag to prevent adding to history
      setCurrentIndex((prev) => prev + 1)
    }
  }, [currentIndex, history.length])

  const resetHistory = useCallback((newInitialText: string) => {
    setHistory([newInitialText])
    setCurrentIndex(0)
  }, [])

  return {
    text: history[currentIndex], // Expose the current text from history
    setText,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    resetHistory,
  }
}
