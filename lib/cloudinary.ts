import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  url: string
  public_id: string
  width: number
  height: number
}

export async function uploadToCloudinary(
  file: Buffer,
  folder: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        quality: 'auto',
        fetch_format: 'auto',
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'))
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
          })
        }
      }
    )
    stream.end(file)
  })
}

export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: string } = {}
): string {
  const { width, height, crop = 'fill' } = options
  return cloudinary.url(publicId, {
    quality: 'auto',
    fetch_format: 'auto',
    width,
    height,
    crop,
    secure: true,
  })
}

export function getTextureThumbnail(publicId: string): string {
  return getOptimizedUrl(publicId, { width: 300, height: 200, crop: 'fill' })
}

export default cloudinary
