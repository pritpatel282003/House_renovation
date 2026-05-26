import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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

    // Pick the best redesigned image: AI polished > overlay composite
    const bestRedesignedUrl =
      project.ai_designed_image_url ||
      project.redesigned_image_url ||
      null

    console.log('[report] Building report for project:', projectId)
    console.log('[report] original_image_url:', project.original_image_url)
    console.log('[report] ai_designed_image_url:', project.ai_designed_image_url)
    console.log('[report] redesigned_image_url:', project.redesigned_image_url)
    console.log('[report] Using redesigned URL for report:', bestRedesignedUrl)

    const reportPayload = {
      ...project,
      original_image_url: project.original_image_url,
      redesigned_image_url: bestRedesignedUrl,
    }

    const pyRes = await fetch(`${process.env.PYTHON_SERVICE_URL}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-secret': process.env.PYTHON_SERVICE_SECRET!,
      },
      body: JSON.stringify(reportPayload),
    })

    if (!pyRes.ok) {
      const err = await pyRes.text()
      console.error('[report] Python service error:', err)
      return NextResponse.json(
        { error: `Report generation failed: ${err}` },
        { status: 502 }
      )
    }

    const pdfBuffer = Buffer.from(await pyRes.arrayBuffer())
    console.log('[report] PDF generated, size:', pdfBuffer.length, 'bytes')

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const storagePath = `${user.id}/${projectId}/report.pdf`

    const { error: uploadError } = await serviceSupabase.storage
      .from('reports')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    await supabase
      .from('projects')
      .update({
        report_storage_path: storagePath,
        status: 'completed',
      })
      .eq('id', projectId)

    const { data: signedUrl } = await serviceSupabase.storage
      .from('reports')
      .createSignedUrl(storagePath, 3600)

    return NextResponse.json({ reportUrl: signedUrl?.signedUrl })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 })
  }
}
