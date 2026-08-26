'use client'

import { useState } from 'react'
import { Maximize2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropertyGalleryViewerProps {
  images?: string[]
  title: string
  category: string
  status: string
  statusBadgeClass?: string
}

export default function PropertyGalleryViewer({
  images = [],
  title,
  category,
  status,
  statusBadgeClass = 'bg-emerald-50 text-emerald-700',
}: PropertyGalleryViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const galleryImages = images && images.length > 0 
    ? images 
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800']

  const currentImage = galleryImages[activeIndex] || galleryImages[0]

  return (
    <div className="space-y-3">
      {/* Main Image Banner with uncropped presentation */}
      <div 
        onClick={() => setLightboxOpen(true)}
        className="relative min-h-80 sm:min-h-105 max-h-125 w-full bg-slate-950 rounded-t-3xl overflow-hidden cursor-pointer group flex items-center justify-center border-b border-gray-100"
      >
        {/* Ambient blurred backdrop for seamless fit with any aspect ratio */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none select-none"
        />

        {/* Full uncropped image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage}
          alt={`${title} - Photo ${activeIndex + 1}`}
          className="relative z-10 max-h-80 sm:max-h-105 max-w-full w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-[1.02] drop-shadow-xl"
        />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-20 flex gap-2 pointer-events-none">
          <span className="bg-emerald-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-xl shadow-md">
            For {category}
          </span>
          <span className={cn('font-bold text-xs uppercase px-3 py-1 rounded-xl shadow-md', statusBadgeClass)}>
            {status}
          </span>
        </div>

        {/* Top Right Counter & Zoom Button */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <span className="bg-black/70 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/10 shadow-md">
            {activeIndex + 1} / {galleryImages.length}
          </span>
          <button
            type="button"
            className="p-2 bg-black/70 hover:bg-emerald-600 text-white rounded-full backdrop-blur-md border border-white/10 transition-colors shadow-md"
            title="View Full Size"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Arrows for multi-photo */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-emerald-600 text-white backdrop-blur-sm transition-all hover:scale-110 shadow-lg"
              title="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setActiveIndex((prev) => (prev + 1) % galleryImages.length)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-emerald-600 text-white backdrop-blur-sm transition-all hover:scale-110 shadow-lg"
              title="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row if multiple photos */}
      {galleryImages.length > 1 && (
        <div className="px-6 py-2 flex gap-2.5 overflow-x-auto">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'relative shrink-0 w-16 h-12 rounded-xl overflow-hidden bg-slate-900 border-2 transition-all',
                activeIndex === idx
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105 shadow-md'
                  : 'border-gray-200 opacity-60 hover:opacity-100'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-3" onClick={(e) => e.stopPropagation()}>
            <div className="min-w-0 pr-4">
              <h3 className="text-base sm:text-lg font-bold truncate">{title}</h3>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                Photo {activeIndex + 1} of {galleryImages.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-red-600/80 text-white transition-colors"
              title="Close (Esc)"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Large Image Center */}
          <div className="relative flex-1 flex items-center justify-center my-auto py-2 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                className="absolute left-2 sm:left-6 z-10 p-3 rounded-full bg-black/70 hover:bg-emerald-600 text-white backdrop-blur-sm transition-all hover:scale-110 shadow-xl"
              >
                <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
              </button>
            )}

            <div className="flex items-center justify-center w-full h-full max-h-[82vh] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryImages[activeIndex]}
                alt={`${title} - Fullscreen photo ${activeIndex + 1}`}
                className="max-h-[82vh] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl transition-all duration-300 drop-shadow-2xl"
              />
            </div>

            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev + 1) % galleryImages.length)}
                className="absolute right-2 sm:right-6 z-10 p-3 rounded-full bg-black/70 hover:bg-emerald-600 text-white backdrop-blur-sm transition-all hover:scale-110 shadow-xl"
              >
                <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="pt-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-4xl mx-auto">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      'relative shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all',
                      activeIndex === idx
                        ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-400/50'
                        : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/50'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
