import type { CostBreakdown } from '@/lib/types'

export interface EstimateResponse {
  cost_data: CostBreakdown
  error?: string
}

export async function runEstimate(
  projectId: string,
  options?: { pixels_per_foot?: number; wastage_percent?: number }
): Promise<CostBreakdown> {
  const res = await fetch('/api/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, ...options }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Estimation failed')
  return data.cost_data
}

export async function updateRates(
  projectId: string,
  overrides: Record<string, { material_rate?: number; labor_rate?: number }>
): Promise<CostBreakdown> {
  const res = await fetch('/api/estimate/rates', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, overrides }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Rate update failed')
  return data.cost_data
}
