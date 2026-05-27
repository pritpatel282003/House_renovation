export interface ReportGenerateResponse {
  reportUrl: string
  error?: string
}

export async function generateReport(projectId: string): Promise<string> {
  const res = await fetch('/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Report generation failed')
  return data.reportUrl
}

export async function downloadReport(projectId: string): Promise<Blob> {
  const res = await fetch(`/api/report/download?projectId=${projectId}`)
  if (!res.ok) throw new Error('Download failed')
  const { url } = await res.json()
  const pdfRes = await fetch(url)
  if (!pdfRes.ok) throw new Error('PDF fetch failed')
  return pdfRes.blob()
}
