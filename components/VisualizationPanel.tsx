'use client'

import { useState, useRef } from 'react'
import { useProjectStore, saveSegmentsToDb } from '@/store/projectStore'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, ArrowRight, Sparkles } from 'lucide-react'

function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel,
  afterLabel,
}: {
  beforeUrl: string
  afterUrl: string
  beforeLabel: string
  afterLabel: string
}) {
  const [sliderPos, setSliderPos] = useState(50)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    setSliderPos((x / rect.width) * 100)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width))
    setSliderPos((x / rect.width) * 100)
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden border border-[#1C2B3A]/10 cursor-col-resize select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setDragging(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterUrl}
        alt={afterLabel}
        className="w-full h-auto block"
        draggable={false}
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="w-full h-auto block"
          draggable={false}
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-[#1C2B3A]/30 rounded-full" />
            <div className="w-0.5 h-4 bg-[#1C2B3A]/30 rounded-full" />
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
        {beforeLabel}
      </div>
      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
        {afterLabel}
      </div>
    </div>
  )
}

export default function VisualizationPanel() {
  const {
    projectId,
    originalImageUrl,
    aiDesignedImageUrl,
    isAiDesigning,
    setVisualization,
    setAiDesign,
    setAiDesigning,
    isLoading,
    setLoading,
    nextStep,
  } = useProjectStore()

  const [elapsedSecs, setElapsedSecs] = useState(0)

  const handleGenerate = async () => {
    if (!projectId) return
    setLoading(true)
    setElapsedSecs(0)
    const timer = setInterval(() => setElapsedSecs((s) => s + 1), 1000)
    try {
      await saveSegmentsToDb()
      const res = await fetch('/api/ai-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.redesigned_image_url) {
        setVisualization(data.redesigned_image_url)
      }
      if (data.ai_designed_image_url) {
        setAiDesign(data.ai_designed_image_url)
      }
    } catch (err) {
      console.error('Visualization failed:', err)
    } finally {
      clearInterval(timer)
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!projectId) return
    setAiDesigning(true)
    setElapsedSecs(0)
    const timer = setInterval(() => setElapsedSecs((s) => s + 1), 1000)
    try {
      const res = await fetch('/api/ai-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.redesigned_image_url) {
        setVisualization(data.redesigned_image_url)
      }
      if (data.ai_designed_image_url) {
        setAiDesign(data.ai_designed_image_url)
      }
    } catch (err) {
      console.error('Regeneration failed:', err)
    } finally {
      clearInterval(timer)
      setAiDesigning(false)
    }
  }

  if (!aiDesignedImageUrl && !isLoading && !isAiDesigning) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6">
        <div className="text-center max-w-md">
          <h3 className="font-heading text-2xl font-semibold text-[#1C2B3A] mb-2">
            Generate Your Redesign
          </h3>
          <p className="text-[#1C2B3A]/60">
            Our AI will apply the selected materials to your house and generate
            a photorealistic visualization of your renovated exterior.
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          className="bg-[#C4622D] hover:bg-[#a85225] px-8 gap-2"
          size="lg"
        >
          <Sparkles className="h-4 w-4" />
          Generate AI Redesign
        </Button>
      </div>
    )
  }

  if (isLoading || isAiDesigning) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-[#C4622D]" />
          <Sparkles className="h-5 w-5 text-purple-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <p className="text-[#1C2B3A]/70 font-medium">
          AI is generating your photorealistic redesign...
        </p>
        <p className="text-sm text-[#1C2B3A]/40">
          {elapsedSecs}s elapsed — typically takes 30-50 seconds
        </p>
        <div className="w-64 bg-[#1C2B3A]/5 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C4622D] to-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min((elapsedSecs / 50) * 100, 95)}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Generated: Original vs AI */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-[#1C2B3A]">AI Redesign</h3>
          <span className="text-xs text-[#1C2B3A]/40 ml-1">
            Slide to compare original vs AI-generated
          </span>
        </div>
        <BeforeAfterSlider
          beforeUrl={originalImageUrl}
          afterUrl={aiDesignedImageUrl}
          beforeLabel="Original"
          afterLabel="AI Redesign"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={handleRegenerate}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Regenerate
        </Button>

        <Button
          onClick={nextStep}
          className="flex-1 bg-[#C4622D] hover:bg-[#a85225] gap-2"
          size="lg"
        >
          Continue to Cost Estimate
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
