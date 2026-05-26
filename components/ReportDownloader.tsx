'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/projectStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Download, FileText, CheckCircle2, LayoutDashboard } from 'lucide-react'

export default function ReportDownloader() {
  const {
    projectId,
    reportUrl,
    setReportUrl,
    isLoading,
    setLoading,
  } = useProjectStore()

  const [downloading, setDownloading] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReportUrl(data.reportUrl)
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
      const res = await fetch(`/api/report/download?projectId=${projectId}`)
      if (!res.ok) throw new Error('Download failed')
      const { url } = await res.json()
      const pdfRes = await fetch(url)
      if (!pdfRes.ok) throw new Error('PDF fetch failed')
      const blob = await pdfRes.blob()
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

  if (reportUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
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
        <div className="flex gap-3">
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
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <Card className="border-dashed border-2 border-[#1C2B3A]/10 max-w-md w-full">
        <CardContent className="flex flex-col items-center py-12 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-[#C4622D]/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-[#C4622D]" />
          </div>
          <div className="text-center">
            <h3 className="font-heading text-xl font-semibold text-[#1C2B3A] mb-1">
              Generate Your Report
            </h3>
            <p className="text-sm text-[#1C2B3A]/60">
              Create a detailed PDF with material specifications and complete cost breakdown.
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
