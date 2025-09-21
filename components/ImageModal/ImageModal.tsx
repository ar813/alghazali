"use client"

import React from 'react'
import { X } from 'lucide-react'

type ImageModalProps = {
  src?: string | null
  alt?: string
  open: boolean
  onClose: () => void
}

const ImageModal: React.FC<ImageModalProps> = ({ src, alt = 'Image preview', open, onClose }) => {
  if (!open || !src) return null

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Image Preview">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Content */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
          aria-label="Close image preview"
        >
          <X size={20} />
        </button>

        {/* Image */}
        <img
          src={src}
          alt={alt}
          className="max-w-[95vw] max-h-[85vh] object-contain shadow-2xl rounded-lg"
        />
      </div>
    </div>
  )
}

export default ImageModal
