'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Loader2,
  Download,
  FileText,
  CheckCircle2,
  LayoutDashboard,
  Sparkles,
  ImageIcon,
} from 'lucide-react'
import { generateReport, downloadReport } from '@/lib/api'

export default function ReportDownloader() {
  const {
    projectId,
    originalImageUrl,
    aiDesignedImageUrl,
    redesignedImageUrl,
    reportUrl,
    setReportUrl,
    isLoading,
    setLoading,
  } = useProjectStore()

  const [downloading, setDownloading] = useState(false)
  const router = useRouter()

  // Best available AI/redesigned image
  const finalImageUrl = aiDesignedImageUrl || redesignedImageUrl

  const handleGenerate = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const url = await generateReport(projectId)
      setReportUrl(url)
    } catch (err) {
      console.error('Report generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!projectId) return
    setDownloading(true)
    try {
      const blob = await downloadReport(projectId)
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `renovation-report-${projectId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#C4622D]" />
        <p className="text-[#1C2B3A]/60 font-medium">Building your report...</p>
        <p className="text-xs text-[#1C2B3A]/40">
          Compiling material details and cost breakdown into a PDF
        </p>
      </div>
    )
  }

  /** Image preview section — shown both before and after generation */
  const ImagePreview = () => {
    if (!originalImageUrl && !finalImageUrl) return null

    return (
      <div className="w-full mb-6">
        <h3 className="font-heading text-lg font-semibold text-[#1C2B3A] mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-[#C4622D]" />
          Project Images
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {originalImageUrl && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#1C2B3A]/50 uppercase tracking-wide">
                Original Photo
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalImageUrl}
                alt="Original house photo"
                className="w-full rounded-xl border border-[#1C2B3A]/10 object-cover"
                style={{ maxHeight: '260px', objectFit: 'cover' }}
              />
            </div>
          )}
          {finalImageUrl && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-purple-500 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Redesigned
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={finalImageUrl}
                alt="AI redesigned house"
                className="w-full rounded-xl border border-purple-200 object-cover"
                style={{ maxHeight: '260px', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (reportUrl) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <ImagePreview />

        <div className="flex flex-col items-center gap-6 py-6">
          <div className="h-20 w-20 rounded-3xl bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <div className="text-center max-w-md">
            <h3 className="font-heading text-2xl font-semibold text-[#1C2B3A] mb-2">
              Report Ready
            </h3>
            <p className="text-[#1C2B3A]/60">
              Your renovation cost estimate report has been generated.
              Download it to share with contractors or keep for your records.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-[#C4622D] hover:bg-[#a85225] gap-2 px-8"
              size="lg"
            >
              {downloading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerate}
              className="gap-2"
            >
              Regenerate
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="gap-2 mt-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <ImagePreview />

      <Card className="border-dashed border-2 border-[#1C2B3A]/10">
        <CardContent className="flex flex-col items-center py-12 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-[#C4622D]/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-[#C4622D]" />
          </div>
          <div className="text-center">
            <h3 className="font-heading text-xl font-semibold text-[#1C2B3A] mb-1">
              Generate Your Report
            </h3>
            <p className="text-sm text-[#1C2B3A]/60">
              Create a detailed PDF with the images above, material specifications, and complete cost breakdown.
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            className="bg-[#C4622D] hover:bg-[#a85225] gap-2 mt-2"
            size="lg"
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
