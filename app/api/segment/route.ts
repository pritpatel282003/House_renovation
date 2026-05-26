import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const pyRes = await fetch(`${process.env.PYTHON_SERVICE_URL}/segment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-secret': process.env.PYTHON_SERVICE_SECRET!,
      },
      body: JSON.stringify({
        image_url: project.original_image_url,
        project_id: projectId,
      }),
    })

    if (!pyRes.ok) {
      const err = await pyRes.text()
      return NextResponse.json(
        { error: `Segmentation failed: ${err}` },
        { status: 502 }
      )
    }

    const result = await pyRes.json()

    await supabase
      .from('projects')
      .update({ segmentation_data: result.segments, status: 'segmented' })
      .eq('id', projectId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Segment error:', error)
    return NextResponse.json({ error: 'Segmentation failed' }, { status: 500 })
  }
}
