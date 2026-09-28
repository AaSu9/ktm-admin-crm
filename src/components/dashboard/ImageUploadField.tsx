'use client'

import { useState, useRef } from 'react'
import { Camera, UploadCloud, X, Image as ImageIcon, Eye, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadFieldProps {
  defaultImages?: string[]
}

export default function ImageUploadField({ defaultImages = [] }: ImageUploadFieldProps) {
  const [images, setImages] = useState<string[]>(defaultImages)
  const [loading, setLoading] = useState(false)
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDim = 1400

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'
            ctx.drawImage(img, 0, 0, width, height)
          }

          // Always compress to JPEG (or WebP where supported) — PNG from canvas is uncompressed and can be 5MB+
          let quality = 0.78
          let compressed = canvas.toDataURL('image/jpeg', quality)

          // If still over 500KB base64, reduce quality slightly to ensure safety
          if (compressed.length > 700000) {
            quality = 0.65
            compressed = canvas.toDataURL('image/jpeg', quality)
          }

          resolve(compressed)
        }
        img.onerror = () => resolve((event.target?.result as string) || '')
        img.src = (event.target?.result as string) || ''
      }
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setLoading(true)
    try {
      const fileList = Array.from(files)
      const compressedResults = await Promise.all(fileList.map((f) => compressImage(f)))
      const validImages = compressedResults.filter(Boolean)
      setImages((prev) => [...prev, ...validImages])
    } catch (err) {
      console.error('Failed to process images:', err)
    } finally {
      setLoading(false)
      // Reset input so same files can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  /** Move image to index 0 — making it the cover photo shown on the website */
  const setCoverImage = (idx: number) => {
    if (idx === 0) return
    setImages((prev) => {
      const updated = [...prev]
      const [chosen] = updated.splice(idx, 1)
      updated.unshift(chosen)
      return updated
    })
  }

  /** Shift image one position to the left */
  const moveLeft = (idx: number) => {
    if (idx === 0) return
    setImages((prev) => {
      const updated = [...prev]
      ;[updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]]
      return updated
    })
  }

  /** Shift image one position to the right */
  const moveRight = (idx: number) => {
    setImages((prev) => {
      if (idx >= prev.length - 1) return prev
      const updated = [...prev]
      ;[updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]]
      return updated
    })
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <ImageIcon className="h-4.5 w-4.5 text-emerald-600" />
          Property Images ({images.length})
        </label>
        <span className="text-xs text-gray-400">
          Supports all photo formats &amp; any aspect ratio without cropping
        </span>
      </div>

      {/* Hidden File Input — multiple selection enabled */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/gif,image/bmp,image/svg+xml,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.gif,.bmp,.svg"
        multiple
        className="hidden"
      />

      {/* Upload Zone */}
      <div
        onClick={triggerFileInput}
        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-6 bg-gray-50/50 hover:bg-emerald-50/10 hover:border-emerald-500 transition-all cursor-pointer group text-center"
      >
        <div className="flex gap-3 mb-2">
          <div className="p-3 bg-white rounded-2xl shadow-xs border border-gray-100 text-gray-400 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="p-3 bg-white rounded-2xl shadow-xs border border-gray-100 text-gray-400 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
            <Camera className="h-6 w-6" />
          </div>
        </div>
        <p className="text-sm font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">
          Upload Multiple Photos or Take Photos
        </p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          Select multiple files at once. All orientations supported — no cropping.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
          Processing images at high fidelity...
        </div>
      )}

      {/* Cover Photo Hint Banner */}
      {images.length > 1 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-xs text-amber-700">
          <Star className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5 fill-amber-400" />
          <span>
            <strong>Cover Photo:</strong> The image with the gold{' '}
            <span className="inline-flex items-center gap-0.5 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              <Star className="h-2 w-2 fill-white" /> COVER
            </span>{' '}
            badge is shown as the card image on the website. Hover any photo and click{' '}
            <strong>Set as Cover</strong> to change it. Use ← → arrows to reorder.
          </span>
        </div>
      )}

      {/* Photo Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((img, idx) => {
            const isCover = idx === 0
            return (
              <div
                key={`${idx}-${img.slice(-20)}`}
                className={cn(
                  'relative group aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center transition-all',
                  isCover
                    ? 'ring-2 ring-amber-400 border-2 border-amber-400 shadow-md shadow-amber-200/60'
                    : 'border border-gray-200 shadow-xs'
                )}
              >
                {/* Ambient blurred backdrop */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
                />

                {/* Full uncropped image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Property photo ${idx + 1}`}
                  className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />

                {/* Cover crown badge */}
                {isCover ? (
                  <div className="absolute top-1.5 left-1.5 z-20 flex items-center gap-0.5 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md pointer-events-none">
                    <Star className="h-2.5 w-2.5 fill-white shrink-0" />
                    COVER
                  </div>
                ) : (
                  <span className="absolute bottom-1.5 left-1.5 z-20 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none">
                    #{idx + 1}
                  </span>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 z-20 bg-black/0 group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100 flex flex-col justify-between p-1.5">
                  {/* Top-right: view + delete */}
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedPreview(img) }}
                      className="p-1 bg-black/70 hover:bg-black text-white rounded-full shadow transition-all active:scale-95"
                      title="View full size"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(idx) }}
                      className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow transition-all active:scale-95"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Bottom: set cover + reorder */}
                  <div className="flex flex-col gap-1">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCoverImage(idx) }}
                        className="w-full flex items-center justify-center gap-0.5 bg-amber-500/90 hover:bg-amber-500 text-white text-[9px] font-bold py-1 px-1 rounded-lg shadow transition-all active:scale-95"
                        title="Set as cover photo"
                      >
                        <Star className="h-2.5 w-2.5 fill-white shrink-0" />
                        Set as Cover
                      </button>
                    )}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveLeft(idx) }}
                        disabled={idx === 0}
                        className="flex-1 flex items-center justify-center bg-gray-700/80 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[9px] py-1 rounded-lg transition-all active:scale-95"
                        title="Move left"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveRight(idx) }}
                        disabled={idx === images.length - 1}
                        className="flex-1 flex items-center justify-center bg-gray-700/80 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[9px] py-1 rounded-lg transition-all active:scale-95"
                        title="Move right"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full-size preview modal */}
      {selectedPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setSelectedPreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPreview(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPreview}
              alt="Full Size Preview"
              className="max-h-[80vh] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}

      {/* Hidden form input — images[0] is always the cover (website reads images[0]) */}
      <input
        type="hidden"
        name="uploaded_images"
        value={JSON.stringify(images)}
      />
    </div>
  )
}
