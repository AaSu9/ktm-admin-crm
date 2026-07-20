'use client'

import { useState, useRef } from 'react'
import { Camera, UploadCloud, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadFieldProps {
  defaultImages?: string[]
}

export default function ImageUploadField({ defaultImages = [] }: ImageUploadFieldProps) {
  const [images, setImages] = useState<string[]>(defaultImages)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setLoading(true)
    const newImages: string[] = []
    let loadedCount = 0

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string)
        }
        loadedCount++
        if (loadedCount === files.length) {
          setImages((prev) => [...prev, ...newImages])
          setLoading(false)
        }
      }
      reader.onerror = () => {
        loadedCount++
        if (loadedCount === files.length) {
          setLoading(false)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
        <ImageIcon className="h-4.5 w-4.5 text-emerald-600" />
        Property Images
      </label>

      {/* Hidden File Input (accept="image/*" naturally prompts mobile camera capture) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
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
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          Supports image files from desktop, phone gallery, or directly taking a snap from your device camera.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
          Processing images...
        </div>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-xs bg-gray-50">
              <img
                src={img}
                alt={`preview-${idx}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-all duration-150 active:scale-95"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
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
