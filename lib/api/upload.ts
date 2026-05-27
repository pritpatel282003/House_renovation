export interface UploadResponse {
  success: boolean
  msg: string
  projectId?: string
  warnings?: string[]
}

export async function uploadImage(file: File, title?: string): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('image', file)
  if (title) formData.append('title', title)

  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  return res.json()
}
