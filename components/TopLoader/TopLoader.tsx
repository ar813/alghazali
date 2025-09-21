"use client"

import React, { useEffect, useRef, useState } from 'react'

/**
 * A lightweight top progress bar to indicate background loading without blocking UI.
 * - Debounces show to avoid flicker for ultra-fast loads
 * - Animates progress while loading, then completes and fades out
 */
export default function TopLoader({ loading, debounceMs = 150 }: { loading: boolean; debounceMs?: number }) {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  // Debounce showing the loader
  useEffect(() => {
    if (loading) {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setVisible(true), debounceMs)
    } else {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      // Complete the bar, then fade out
      if (visible) {
        setProgress(100)
        const t = window.setTimeout(() => {
          setVisible(false)
          setProgress(0)
        }, 300)
        return () => window.clearTimeout(t)
      } else {
        setProgress(0)
        setVisible(false)
      }
    }
  }, [loading, debounceMs, visible])

  // Animate progress while loading
  useEffect(() => {
    if (!visible || !loading) return

    const tick = () => {
      setProgress(prev => {
        // Ease towards 90% while loading
        if (prev < 90) {
          const next = prev + (90 - prev) * 0.08 + 0.5
          return Math.min(next, 90)
        }
        return prev
      })
      rafRef.current = window.requestAnimationFrame(tick)
    }
    rafRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [visible, loading])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
