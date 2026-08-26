'use client'

import { useState, useRef } from 'react'
import { Camera, UploadCloud, X, Image as ImageIcon, Eye } from 'lucide-react'

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
          const maxDim = 2048

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
          ctx?.drawImage(img, 0, 0, width, height)
          
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          const compressed = canvas.toDataURL(mimeType, 0.85)
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
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
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
          Supports all photo formats & any aspect ratio without cropping
        </span>
      </div>

      {/* Hidden File Input supporting all standard and mobile image formats */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/gif,image/bmp,image/svg+xml,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif,.gif,.bmp,.svg"
        multiple
        className="hidden"
      />

      {/* Drag & Drop / Click Zone */}
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
          Upload Files or Take Photos
        </p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          Supports portrait (vertical), landscape (horizontal), square, or panoramic photos in full size without cropping.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
          Processing images at high fidelity...
        </div>
      )}

      {/* Uncropped Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="relative group aspect-4/3 rounded-2xl overflow-hidden border border-gray-200 bg-slate-950 flex items-center justify-center shadow-xs"
            >
              {/* Ambient backdrop */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
              />
              
              {/* Uncropped full image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`preview-${idx}`}
                className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />

              {/* Index badge */}
              <span className="absolute bottom-2 left-2 z-20 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                #{idx + 1}
              </span>

              {/* Actions Overlay */}
              <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPreview(img)
                  }}
                  className="p-1.5 bg-black/60 hover:bg-black text-white rounded-full shadow-md transition-all active:scale-95"
                  title="View full size"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(idx)
                  }}
                  className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-all active:scale-95"
                  title="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-size preview modal dialog */}
      {selectedPreview && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setSelectedPreview(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
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

      {/* Hidden input to pass data to Form Submit Action */}
      <input
        type="hidden"
        name="uploaded_images"
        value={JSON.stringify(images)}
      />
    </div>
  )
}
