export interface AiDesignResponse {
  redesigned_image_url?: string
  ai_designed_image_url?: string
  error?: string
}

export async function generateAiDesign(projectId: string): Promise<AiDesignResponse> {
  const res = await fetch('/api/ai-design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'AI design generation failed')
  return data
}
