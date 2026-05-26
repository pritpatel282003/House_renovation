'use client'

import { useState } from 'react'
import type { Segment } from '@/lib/types'

interface RegionPreviewProps {
  imageUrl: string
  segment: Segment
}

export default function RegionPreview({ imageUrl, segment }: RegionPreviewProps) {
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
  const displayName = segment.label.replace(/_/g, ' ')

  const polygonPoints = segment.mask_polygon
    .map(([x, y]) => `${x * imgSize.width},${y * imgSize.height}`)
    .join(' ')

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#1C2B3A]/10 bg-white overflow-hidden p-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1C2B3A] capitalize">
          {displayName}
        </p>
        <p className="text-xs text-[#1C2B3A]/50 mt-0.5">
          You are selecting a material for this area
        </p>
      </div>

      <div className="relative w-72 flex-shrink-0 rounded-lg overflow-hidden border border-[#1C2B3A]/10 bg-[#1C2B3A]/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Full house view"
          className="w-full h-auto block"
          onLoad={(e) => {
            const img = e.currentTarget
            setImgSize({ width: img.clientWidth, height: img.clientHeight })
          }}
          draggable={false}
        />
        {imgSize.width > 0 && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${imgSize.width} ${imgSize.height}`}
          >
            <polygon
              points={polygonPoints}
              fill="rgba(196, 98, 45, 0.4)"
              stroke="#C4622D"
              strokeWidth={2.5}
            />
          </svg>
        )}
        <span className="absolute bottom-1.5 left-1.5 right-1.5 text-center text-[10px] text-white bg-black/55 rounded px-1.5 py-0.5">
          Full view
        </span>
      </div>
    </div>
  )
}
