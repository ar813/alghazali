"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

interface Props {
  src: string
  aspect?: number // width/height
  onCancel: () => void
  onCropped: (file: File) => void
}

// A very lightweight rectangle selection cropper (no external deps)
// Usage: Click-drag to draw a rectangle. Adjust by re-drawing. Confirm to crop.
export default function ImageCropper({ src, aspect: _aspect = 0, onCancel, onCropped }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState<string | null>(null)
  const [start, setStart] = useState<{ x: number, y: number } | null>(null)
  const [end, setEnd] = useState<{ x: number, y: number } | null>(null)
  const [dragMode, setDragMode] = useState<'none' | 'creating' | 'moving' | 'resizing'>('none')
  const [moveOffset, setMoveOffset] = useState<{ dx: number, dy: number }>({ dx: 0, dy: 0 })
  const [activeHandle, setActiveHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null)
  // aspect lock mode: 0 = free, >0 = fixed ratio (w/h)
  const [aspectMode, setAspectMode] = useState<'free' | 'square' | 'portrait' | 'landscape'>(_aspect === 0 ? 'free' : (_aspect === 1 ? 'square' : (_aspect >= 1 ? 'landscape' : 'portrait')))
  const aspectValue = useMemo(() => {
    if (aspectMode === 'free') return 0
    if (aspectMode === 'square') return 1
    if (aspectMode === 'portrait') return 3 / 4
    if (aspectMode === 'landscape') return 4 / 3
    return 0
  }, [aspectMode])

  useEffect(() => {
    return () => {
      try { URL.revokeObjectURL(src) } catch { }
    }
  }, [src])

  const clamp = (x: number, y: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x, y }
    return { x: Math.max(0, Math.min(rect.width, x)), y: Math.max(0, Math.min(rect.height, y)) }
  }

  const getSelection = () => {
    if (!start || !end) return null
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    const w = Math.abs(end.x - start.x)
    const h = Math.abs(end.y - start.y)
    return { x, y, w, h }
  }

  const hitTest = (px: number, py: number) => {
    const sel = getSelection()
    if (!sel) return { inBox: false, handle: null as any }
    const { x, y, w, h } = sel
    const pad = 8
    const inBox = px >= x && px <= x + w && py >= y && py <= y + h
    const near = (ax: number, bx: number) => Math.abs(ax - bx) <= pad
    let handle: 'nw' | 'ne' | 'sw' | 'se' | null = null
    if (near(px, x) && near(py, y)) handle = 'nw'
    else if (near(px, x + w) && near(py, y)) handle = 'ne'
    else if (near(px, x) && near(py, y + h)) handle = 'sw'
    else if (near(px, x + w) && near(py, y + h)) handle = 'se'
    return { inBox, handle }
  }

  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const { x, y } = clamp(e.clientX - rect.left, e.clientY - rect.top)
    const hit = hitTest(x, y)
    if (hit.handle) {
      setActiveHandle(hit.handle)
      setDragMode('resizing')
    } else if (hit.inBox) {
      const sel = getSelection()!
      setMoveOffset({ dx: x - sel.x, dy: y - sel.y })
      setDragMode('moving')
    } else {
      setStart({ x, y })
      setEnd({ x, y })
      setDragMode('creating')
    }
  }

  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (dragMode === 'none') return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const { x, y } = clamp(e.clientX - rect.left, e.clientY - rect.top)
    if (dragMode === 'creating') {
      if (aspectValue && start) {
        // lock to aspect during creation
        const dx = x - start.x
        const dy = y - start.y
        // decide which delta dominates to keep selection intuitive
        if (Math.abs(dx) > Math.abs(dy)) {
          const w = dx
          const h = w / aspectValue
          setEnd({ x: start.x + w, y: start.y + h })
        } else {
          const h = dy
          const w = h * aspectValue
          setEnd({ x: start.x + w, y: start.y + h })
        }
      } else {
        setEnd({ x, y })
      }
    } else if (dragMode === 'moving') {
      const sel = getSelection(); if (!sel) return
      const nx = x - moveOffset.dx
      const ny = y - moveOffset.dy
      const cl = clamp(nx, ny)
      setStart({ x: cl.x, y: cl.y })
      setEnd({ x: cl.x + sel.w, y: cl.y + sel.h })
    } else if (dragMode === 'resizing') {
      if (!start || !end) return
      let s = { ...start }; let e2 = { ...end }
      // Normalize so start is top-left and end is bottom-right for easier math
      const topLeft = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) }
      const bottomRight = { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) }
      s = { x: topLeft.x, y: topLeft.y }
      e2 = { x: bottomRight.x, y: bottomRight.y }
      if (activeHandle === 'nw') { s = { x, y } }
      if (activeHandle === 'ne') { s = { x: s.x, y }; e2 = { x, y: e2.y } }
      if (activeHandle === 'sw') { s = { x, y: s.y }; e2 = { x: e2.x, y } }
      if (activeHandle === 'se') { e2 = { x, y } }
      // Ensure minimum size
      const min = 8
      const nx = Math.min(s.x, e2.x), ny = Math.min(s.y, e2.y)
      const mx = Math.max(s.x, e2.x), my = Math.max(s.y, e2.y)
      let w = Math.max(min, mx - nx)
      let h = Math.max(min, my - ny)
      if (aspectValue) {
        // adjust w/h to maintain aspectValue with anchor at (nx, ny)
        const targetH = w / aspectValue
        const targetW = h * aspectValue
        if (activeHandle === 'nw' || activeHandle === 'ne') {
          // prefer height change
          w = targetW; // based on h
        } else {
          h = targetH; // based on w
        }
      }
      setStart({ x: nx, y: ny })
      setEnd({ x: nx + w, y: ny + h })
    }
  }

  const onMouseUp: React.MouseEventHandler<HTMLDivElement> = () => {
    setDragMode('none')
    setActiveHandle(null)
  }

  // Touch support
  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const t = e.touches[0]; if (!t) return
    const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return
    const { x, y } = clamp(t.clientX - rect.left, t.clientY - rect.top)
    const hit = hitTest(x, y)
    if (hit.handle) { setActiveHandle(hit.handle); setDragMode('resizing') }
    else if (hit.inBox) { const sel = getSelection()!; setMoveOffset({ dx: x - sel.x, dy: y - sel.y }); setDragMode('moving') }
    else { setStart({ x, y }); setEnd({ x, y }); setDragMode('creating') }
  }
  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const t = e.touches[0]; if (!t) return
    const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return
    onMouseMove({ clientX: t.clientX, clientY: t.clientY } as any as React.MouseEvent<HTMLDivElement>)
  }
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => { onMouseUp({} as any) }

  const sel = getSelection()

  const handleCrop = async () => {
    const sel = getSelection()
    const img = imgRef.current
    const container = containerRef.current
    if (!sel || !img || !container) return
    if (!imgLoaded || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
      // image not ready; prevent crop
      return
    }

    // Map selection from container coords to the image's rendered box (object-contain)
    const contW = container.clientWidth
    const contH = container.clientHeight
    const natW = img.naturalWidth
    const natH = img.naturalHeight
    const containerRatio = contW / contH
    const imageRatio = natW / natH
    let renderW = 0, renderH = 0, offsetX = 0, offsetY = 0
    if (imageRatio > containerRatio) {
      // limited by width
      renderW = contW
      renderH = contW / imageRatio
      offsetX = 0
      offsetY = (contH - renderH) / 2
    } else {
      // limited by height
      renderH = contH
      renderW = contH * imageRatio
      offsetY = 0
      offsetX = (contW - renderW) / 2
    }

    // Selection relative to rendered image rect
    const relX = Math.max(0, Math.min(sel.x - offsetX, renderW))
    const relY = Math.max(0, Math.min(sel.y - offsetY, renderH))
    const relW = Math.max(1, Math.min(sel.w, renderW - relX))
    const relH = Math.max(1, Math.min(sel.h, renderH - relY))

    const scaleX = natW / renderW
    const scaleY = natH / renderH

    const sx = Math.round(relX * scaleX)
    const sy = Math.round(relY * scaleY)
    const sw = Math.max(1, Math.round(relW * scaleX))
    const sh = Math.max(1, Math.round(relH * scaleY))

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(sw)
    canvas.height = Math.round(sh)
    const ctx = canvas.getContext('2d')!
    try {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
    } catch {
      setImgError('Failed to draw image. Please try selecting the image again.')
      return
    }

    const blob: Blob = await new Promise((resolve) => canvas.toBlob(b => resolve(b as Blob), 'image/png', 0.95))
    const file = new File([blob], 'cropped.png', { type: 'image/png' })
    onCropped(file)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">Crop Image</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Aspect:</span>
            <button onClick={() => setAspectMode('free')} className={`px-2 py-1 border rounded ${aspectMode === 'free' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Free</button>
            <button onClick={() => setAspectMode('square')} className={`px-2 py-1 border rounded ${aspectMode === 'square' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Square</button>
            <button onClick={() => setAspectMode('portrait')} className={`px-2 py-1 border rounded ${aspectMode === 'portrait' ? 'bg-blue-600 text-white' : 'bg-white'}`}>3:4</button>
            <button onClick={() => setAspectMode('landscape')} className={`px-2 py-1 border rounded ${aspectMode === 'landscape' ? 'bg-blue-600 text-white' : 'bg-white'}`}>4:3</button>
          </div>
        </div>
        <div
          ref={containerRef}
          className="relative w-full h-[60vh] bg-gray-100 overflow-hidden select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Image
            ref={imgRef}
            src={src}
            alt="To crop"
            className="object-contain"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => { setImgLoaded(true); setImgError(null) }}
            onError={() => { setImgLoaded(false); setImgError('Failed to load image') }}
            unoptimized
          />
          {/* Overlay shading */}
          {sel && (
            <>
              <div className="absolute inset-0 bg-black/40 pointer-events-none" style={{ clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${sel.x}px ${sel.y}px, ${sel.x + sel.w}px ${sel.y}px, ${sel.x + sel.w}px ${sel.y + sel.h}px, ${sel.x}px ${sel.y + sel.h}px, ${sel.x}px ${sel.y}px)` }} />
              <div className="absolute border-2 border-blue-500/80 bg-blue-500/10" style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }} />
              {/* Corner handles */}
              {['nw', 'ne', 'sw', 'se'].map(h => {
                const cx = h === 'nw' ? sel.x : h === 'ne' ? sel.x + sel.w : h === 'sw' ? sel.x : sel.x + sel.w
                const cy = h === 'nw' ? sel.y : h === 'ne' ? sel.y : h === 'sw' ? sel.y + sel.h : sel.y + sel.h
                return <div key={h} className="absolute w-3 h-3 bg-white border border-blue-500 rounded-sm" style={{ left: cx - 6 / 2, top: cy - 6 / 2 }} />
              })}
            </>
          )}
        </div>
        <div className="mt-4 flex justify-between gap-2 items-center">
          <div className="text-sm text-red-600 h-5">{imgError || ''}</div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
            <button onClick={handleCrop} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={!imgLoaded || !sel || sel.w < 4 || sel.h < 4}>Use</button>
          </div>
        </div>
      </div>
    </div>
  )
}
