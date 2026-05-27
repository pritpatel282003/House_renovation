import type { Segment } from '@/lib/types'

export async function saveSegments(projectId: string, segments: Segment[]): Promise<boolean> {
  try {
    const res = await fetch('/api/save-segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, segments }),
    })
    return res.ok
  } catch {
    return false
  }
}
