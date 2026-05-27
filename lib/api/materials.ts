import type { Material } from '@/lib/types'

export interface MaterialsResponse {
  materials: Material[]
}

export async function fetchMaterials(category?: string): Promise<Material[]> {
  const url = category ? `/api/materials?category=${category}` : '/api/materials'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch materials')
  const data: MaterialsResponse = await res.json()
  return data.materials
}

export async function assignMaterials(
  projectId: string,
  assignments: Record<string, string>
): Promise<void> {
  const res = await fetch('/api/assign-materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, assignments }),
  })
  if (!res.ok) throw new Error('Failed to save material assignments')
}
