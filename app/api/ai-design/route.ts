import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await request.json()

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const materialIds = Object.values(
      project.material_assignments as Record<string, string>
    )
    const { data: materials } = await supabase
      .from('materials')
      .select('*')
      .in('id', materialIds)

    const pyRes = await fetch(`${process.env.PYTHON_SERVICE_URL}/ai-design`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-secret': process.env.PYTHON_SERVICE_SECRET!,
      },
      body: JSON.stringify({
        image_url: project.original_image_url,
        segmentation_data: project.segmentation_data,
        material_assignments: project.material_assignments,
        materials: materials || [],
      }),
    })

    if (!pyRes.ok) {
      const err = await pyRes.text()
      return NextResponse.json(
        { error: `AI design failed: ${err}` },
        { status: 502 }
      )
    }

    const result = await pyRes.json()

    const overlayBuffer = Buffer.from(result.overlay_image_base64, 'base64')
    const overlayUpload = await uploadToCloudinary(
      overlayBuffer,
      'renovation/redesigned'
    )

    await supabase
      .from('projects')
      .update({
        redesigned_image_url: overlayUpload.url,
        redesigned_cloudinary_public_id: overlayUpload.public_id,
      })
      .eq('id', projectId)

    let aiDesignedUrl: string | null = null

    if (result.ai_polished_image_base64) {
      const polishedBuffer = Buffer.from(
        result.ai_polished_image_base64,
        'base64'
      )
      const polishedUpload = await uploadToCloudinary(
        polishedBuffer,
        'renovation/ai-designed'
      )

      await supabase
        .from('projects')
        .update({ ai_designed_image_url: polishedUpload.url })
        .eq('id', projectId)

      aiDesignedUrl = polishedUpload.url
    }

    return NextResponse.json({
      redesigned_image_url: overlayUpload.url,
      ai_designed_image_url: aiDesignedUrl,
    })
  } catch (error) {
    console.error('AI design error:', error)
    return NextResponse.json({ error: 'AI design failed' }, { status: 500 })
  }
}
