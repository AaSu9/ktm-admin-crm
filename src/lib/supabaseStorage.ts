'use server'

import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Storage client for uploading property images.
 * Prefers SUPABASE_SERVICE_ROLE_KEY for server-side bypass of RLS,
 * falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
function getSupabaseStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('Supabase Storage not configured — NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing')
    return null
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

let bucketChecked = false

async function ensureBucketExists(supabase: any, bucket: string) {
  if (bucketChecked) return
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    const exists = buckets?.some((b: any) => b.name === bucket)
    if (!exists) {
      await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif'],
      })
    }
    bucketChecked = true
  } catch (err) {
    // If listing/creating buckets fails due to RLS/anon permissions, proceed anyway
    console.warn('Could not auto-verify/create Supabase Storage bucket:', err)
  }
}

/**
 * Upload a base64 image to Supabase Storage and return the public URL.
 * Falls back to returning the raw base64 if Supabase is not configured or upload fails.
 */
export async function uploadToSupabaseStorage(base64Data: string): Promise<string> {
  try {
    if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:image')) {
      return base64Data
    }

    const supabase = getSupabaseStorageClient()
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'property-images'

    if (!supabase) {
      console.warn('Supabase client not available — storing base64 fallback')
      return base64Data
    }

    await ensureBucketExists(supabase, bucket)

    // Extract mime type and raw base64 data
    const matches = base64Data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
      return base64Data
    }

    const mimeType = matches[1]
    const base64Content = matches[2]

    // Determine file extension from mime type
    const ext = mimeType.includes('png') ? 'png'
      : mimeType.includes('webp') ? 'webp'
      : mimeType.includes('gif') ? 'gif'
      : mimeType.includes('avif') ? 'avif'
      : 'jpg'

    // Generate unique filename: properties/1696012345678_a1b2c3.jpg
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const filePath = `properties/${timestamp}_${randomId}.${ext}`

    // Convert base64 to Buffer for upload
    const buffer = Buffer.from(base64Content, 'base64')

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: mimeType,
        cacheControl: '31536000', // Cache for 1 year (immutable file names)
        upsert: false,
      })

    if (error) {
      console.error('Supabase Storage upload error:', error.message)
      return base64Data // Fallback to base64
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    if (publicUrlData?.publicUrl) {
      return publicUrlData.publicUrl
    }

    console.error('Failed to get public URL from Supabase Storage')
    return base64Data
  } catch (error) {
    console.error('Supabase Storage upload failed:', error)
    return base64Data
  }
}

