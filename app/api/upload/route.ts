import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import cloudinary from '@/lib/cloudinary'
import { analyzeImageWithAzure } from '@/lib/azure-vision'

const PYTHON_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
const SERVICE_SECRET = process.env.PYTHON_SERVICE_SECRET || ''

function res(success: boolean, msg: string, data?: Record<string, unknown>) {
  return NextResponse.json(
    { success, msg, ...data },
    { status: success ? 200 : 400 }
  )
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return res(false, 'Please log in to upload images.')
    }

    const formData = await request.formData()
    const file = formData.get('image') as File | null
    const title = (formData.get('title') as string) || 'My Renovation Project'

    if (!file) {
      return res(false, 'No image selected. Please choose a photo to upload.')
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return res(false, 'Please upload a JPG, PNG, or WebP image.')
    }

    if (file.size > 20 * 1024 * 1024) {
      return res(false, 'File is too large. Please upload an image under 20MB.')
    }

    // Step 1: Upload to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadResult = await uploadToCloudinary(buffer, 'renovation/originals')

    // Step 2: Blur check via Python/OpenCV (fast, no AI cost)
    try {
      const blurRes = await fetch(`${PYTHON_URL}/validate/blur`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-secret': SERVICE_SECRET,
        },
        body: JSON.stringify({ image_url: uploadResult.url }),
      })

      if (blurRes.ok) {
        const blurData = await blurRes.json()
        if (blurData.is_blurry) {
          await cloudinary.uploader.destroy(uploadResult.public_id)
          return res(
            false,
            'The image is too blurry. Please upload a sharper, clearer photo of the house.'
          )
        }
      }
    } catch {
      console.warn('Blur check unavailable, skipping')
    }

    // Step 3: AI content check via Azure OpenAI (only if image passed blur check)
    const analysis = await analyzeImageWithAzure(uploadResult.url)

    if (!analysis.isBuilding) {
      await cloudinary.uploader.destroy(uploadResult.public_id)
      return res(
        false,
        'Please upload a photo of a house or building exterior. This image does not appear to show a building.'
      )
    }

    if (!analysis.isUsable) {
      await cloudinary.uploader.destroy(uploadResult.public_id)
      return res(
        false,
        'This image is not clear enough for renovation analysis. Please upload a better quality photo.'
      )
    }

    // Step 4: Save to database
    const { data: project, error: dbError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title,
        original_image_url: uploadResult.url,
        original_cloudinary_public_id: uploadResult.public_id,
        status: 'uploaded',
      })
      .select()
      .single()

    if (dbError) {
      return res(false, 'Failed to save project. Please try again.')
    }

    // Build warnings if any
    const warnings: string[] = []
    if (analysis.qualityIssues.length > 0) {
      warnings.push(
        `Image has some quality issues: ${analysis.qualityIssues.join(', ')}. Results may vary.`
      )
    }
    if (analysis.suggestions.length > 0) {
      warnings.push(analysis.suggestions[0])
    }

    return res(true, 'Image uploaded successfully!', {
      projectId: project.id,
      imageUrl: uploadResult.url,
      warnings,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return res(false, 'Something went wrong. Please try again.')
  }
}
