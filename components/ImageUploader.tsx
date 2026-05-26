'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, ImageIcon, Info, Home } from 'lucide-react'

export default function ImageUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgType, setMsgType] = useState<'error' | 'warning' | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)
  const router = useRouter()

  const handleFile = useCallback((f: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(f.type)) {
      setMsg('Please upload a JPG, PNG, or WebP image.')
      setMsgType('error')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setMsg('File is too large. Please upload an image under 20MB.')
      setMsgType('error')
      return
    }

    setFile(f)
    setMsg(null)
    setMsgType(null)
    setWarnings([])
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) handleFile(droppedFile)
    },
    [handleFile]
  )

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setMsg(null)
    setMsgType(null)
    setWarnings([])

    try {
      const formData = new FormData()
      formData.append('image', file)
      if (title) formData.append('title', title)

      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await response.json()

      if (!data.success) {
        setMsg(data.msg)
        setMsgType('error')
        setUploading(false)
        return
      }

      if (data.warnings && data.warnings.length > 0) {
        setMsg(data.msg)
        setMsgType('warning')
        setWarnings(data.warnings)
        setTimeout(() => {
          router.push(`/project/${data.projectId}`)
        }, 3000)
      } else {
        router.push(`/project/${data.projectId}`)
      }
    } catch {
      setMsg('Something went wrong. Please try again.')
      setMsgType('error')
      setUploading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setMsg(null)
    setMsgType(null)
    setWarnings([])
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Project Title (optional)</Label>
        <Input
          id="title"
          placeholder="e.g. Front Facade Renovation"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {!preview ? (
        <div
          className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
            dragActive
              ? 'border-[#C4622D] bg-[#C4622D]/5'
              : 'border-[#1C2B3A]/15 hover:border-[#C4622D]/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-[#C4622D]/10 flex items-center justify-center">
              <Upload className="h-7 w-7 text-[#C4622D]" />
            </div>
            <div>
              <p className="font-medium text-[#1C2B3A]">
                Drop your house photo here, or click to browse
              </p>
              <p className="text-sm text-[#1C2B3A]/50 mt-1">
                JPG, PNG, or WebP — max 20MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-[#1C2B3A]/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full max-h-96 object-contain bg-black/5" />
            <button
              onClick={clearFile}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#1C2B3A]/60">
            <ImageIcon className="h-4 w-4" />
            <span>{file?.name}</span>
            <span className="text-[#1C2B3A]/30">|</span>
            <span>{file ? (file.size / (1024 * 1024)).toFixed(1) : 0} MB</span>
          </div>
        </div>
      )}

      {msg && msgType === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <Home className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-sm font-semibold text-red-800 self-center">{msg}</p>
          </div>
        </div>
      )}

      {msg && msgType === 'warning' && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Home className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">{msg}</p>
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-700 mt-1">{w}</p>
              ))}
              <p className="text-xs text-green-600 mt-1.5">Redirecting to your project...</p>
            </div>
          </div>
        </div>
      )}

      {!preview && !msg && (
        <div className="rounded-lg border border-[#1C2B3A]/5 bg-[#1C2B3A]/[0.02] p-4">
          <p className="text-xs font-medium text-[#1C2B3A]/70 mb-2">Tips for best results:</p>
          <ul className="text-xs text-[#1C2B3A]/50 space-y-1">
            <li>Use a clear, front-facing photo of the building exterior</li>
            <li>Ensure good lighting — avoid very dark or overexposed shots</li>
            <li>Include the full facade — walls, windows, doors visible</li>
            <li>Avoid extreme angles or close-up crops</li>
          </ul>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full bg-[#C4622D] hover:bg-[#a85225]"
        size="lg"
      >
        {uploading ? 'Analyzing & uploading...' : 'Upload & Start Project'}
      </Button>
    </div>
  )
}
