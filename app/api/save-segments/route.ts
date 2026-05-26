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

    const { projectId, segments } = await request.json()

    if (!projectId || !segments) {
      return NextResponse.json(
        { error: 'projectId and segments are required' },
        { status: 400 }
      )
    }

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update({ segmentation_data: segments })
      .eq('id', projectId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save segments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save segments error:', error)
    return NextResponse.json({ error: 'Failed to save segments' }, { status: 500 })
  }
}
