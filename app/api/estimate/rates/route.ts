import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, overrides } = await request.json()

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, original_image_url, segmentation_data, material_assignments')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    for (const [materialId, rates] of Object.entries(
      overrides as Record<string, { material_rate?: number; labor_rate?: number }>
    )) {
      await supabase.from('project_rate_overrides').upsert(
        {
          project_id: projectId,
          material_id: materialId,
          custom_material_rate: rates.material_rate ?? null,
          custom_labor_rate: rates.labor_rate ?? null,
        },
        { onConflict: 'project_id,material_id' }
      )
    }

    const materialIds = Object.values(project.material_assignments as Record<string, string>)
    const { data: materials } = await supabase
      .from('materials')
      .select('*')
      .in('id', materialIds)

    const { data: allOverrides } = await supabase
      .from('project_rate_overrides')
      .select('*')
      .eq('project_id', projectId)

    const overridesMap: Record<string, { material_rate?: number; labor_rate?: number }> = {}
    if (allOverrides) {
      for (const o of allOverrides) {
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
        wastage_percent: 12,
      }),
    })

    if (!pyRes.ok) {
      return NextResponse.json({ error: 'Recalculation failed' }, { status: 502 })
    }

    const result = await pyRes.json()

    await supabase
      .from('projects')
      .update({
        area_data: result.area_data,
        quantity_data: result.quantity_data,
        cost_data: result.cost_data,
      })
      .eq('id', projectId)

    return NextResponse.json({ cost_data: result.cost_data })
  } catch (error) {
    console.error('Rate override error:', error)
    return NextResponse.json({ error: 'Rate update failed' }, { status: 500 })
  }
}
