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

    const { projectId, wastage_percent = 12, pixels_per_foot } = await request.json()

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

    const materialIds = Object.values(project.material_assignments as Record<string, string>)
    const { data: materials } = await supabase
      .from('materials')
      .select('*')
      .in('id', materialIds)

    const { data: rateOverrides } = await supabase
      .from('project_rate_overrides')
      .select('*')
      .eq('project_id', projectId)

    const overridesMap: Record<string, { material_rate?: number; labor_rate?: number }> = {}
    if (rateOverrides) {
      for (const o of rateOverrides) {
        overridesMap[o.material_id] = {
          material_rate: o.custom_material_rate,
          labor_rate: o.custom_labor_rate,
        }
      }
    }

    const pyRes = await fetch(`${process.env.PYTHON_SERVICE_URL}/estimate`, {
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
        rate_overrides: overridesMap,
        wastage_percent,
        ...(pixels_per_foot != null && { pixels_per_foot }),
      }),
    })

    if (!pyRes.ok) {
      const err = await pyRes.text()
      return NextResponse.json(
        { error: `Estimation failed: ${err}` },
        { status: 502 }
      )
    }

    const result = await pyRes.json()

    await supabase
      .from('projects')
      .update({
        area_data: result.area_data,
        quantity_data: result.quantity_data,
        cost_data: result.cost_data,
        status: 'estimated',
      })
      .eq('id', projectId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Estimate error:', error)
    return NextResponse.json({ error: 'Estimation failed' }, { status: 500 })
  }
}
