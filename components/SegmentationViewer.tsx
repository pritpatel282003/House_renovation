'use client'

import { useState, useRef, useEffect, useCallback, useMemo, useTransition } from 'react'
import { useProjectStore, saveSegmentsToDb } from '@/store/projectStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Check, Trash2, RefreshCw, Move, Info, PenTool, X, Pencil } from 'lucide-react'
import type { Segment } from '@/lib/types'

const REGION_COLORS = [
  'rgba(196, 98, 45, 0.35)',
  'rgba(59, 130, 246, 0.35)',
  'rgba(16, 185, 129, 0.35)',
  'rgba(139, 92, 246, 0.35)',
  'rgba(245, 158, 11, 0.35)',
  'rgba(236, 72, 153, 0.35)',
  'rgba(20, 184, 166, 0.35)',
  'rgba(239, 68, 68, 0.35)',
  'rgba(99, 102, 241, 0.35)',
  'rgba(34, 197, 94, 0.35)',
  'rgba(168, 85, 247, 0.35)',
  'rgba(234, 179, 8, 0.35)',
  'rgba(244, 114, 182, 0.35)',
  'rgba(6, 182, 212, 0.35)',
  'rgba(251, 146, 60, 0.35)',
  'rgba(52, 211, 153, 0.35)',
  'rgba(129, 140, 248, 0.35)',
  'rgba(163, 230, 53, 0.35)',
  'rgba(232, 121, 249, 0.35)',
  'rgba(45, 212, 191, 0.35)',
]

const REGION_BORDERS = [
  '#C4622D', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6',
  '#EF4444', '#6366F1', '#22C55E', '#A855F7', '#EAB308', '#F472B6', '#06B6D4',
  '#FB923C', '#34D399', '#818CF8', '#A3E635', '#E879F9', '#2DD4BF',
]

const VERTEX_RADIUS = 6

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const dx = lineEnd[0] - lineStart[0]
  const dy = lineEnd[1] - lineStart[1]
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) {
    const ex = point[0] - lineStart[0]
    const ey = point[1] - lineStart[1]
    return Math.sqrt(ex * ex + ey * ey)
  }
  const num = Math.abs(dy * point[0] - dx * point[1] + lineEnd[0] * lineStart[1] - lineEnd[1] * lineStart[0])
  return num / Math.sqrt(lenSq)
}

function rdpSimplify(polygon: [number, number][], epsilon: number): [number, number][] {
  if (polygon.length <= 3) return polygon

  let maxDist = 0
  let maxIdx = 0
  const end = polygon.length - 1
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(polygon[i], polygon[0], polygon[end])
    if (d > maxDist) {
      maxDist = d
      maxIdx = i
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(polygon.slice(0, maxIdx + 1), epsilon)
    const right = rdpSimplify(polygon.slice(maxIdx), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  return [polygon[0], polygon[end]]
}

function simplifyPolygon(polygon: [number, number][]): [number, number][] {
  if (polygon.length <= 20) return polygon
  const simplified = rdpSimplify(polygon, 0.005)
  return simplified.length >= 4 ? simplified : polygon
}

function closestEdgeInsert(
  polygon: [number, number][],
  px: number,
  py: number
): { afterIndex: number; point: [number, number] } {
  let bestDist = Infinity
  let bestAfter = 0
  let bestPoint: [number, number] = [px, py]

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const abx = b[0] - a[0], aby = b[1] - a[1]
    const apx = px - a[0], apy = py - a[1]
    const lenSq = abx * abx + aby * aby
    let t = lenSq > 0 ? (apx * abx + apy * aby) / lenSq : 0
    t = Math.max(0, Math.min(1, t))
    const cx = a[0] + t * abx
    const cy = a[1] + t * aby
    const dist = (px - cx) ** 2 + (py - cy) ** 2
    if (dist < bestDist) {
      bestDist = dist
      bestAfter = i
      bestPoint = [cx, cy]
    }
  }

  return { afterIndex: bestAfter, point: bestPoint }
}

export default function SegmentationViewer() {
  const {
    projectId,
    originalImageUrl,
    segments,
    selectedRegion,
    setSegments,
    addSegment,
    removeSegment,
    updateSegmentPolygon,
    updateSegmentLabel,
    selectRegion,
    setLoading,
    isLoading,
    nextStep,
  } = useProjectStore()

  const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
  const [dragging, setDragging] = useState<{
    label: string
    vertexIndex: number
  } | null>(null)
  const [editMode, setEditMode] = useState(false)
  const simplifiedRef = useRef<Set<string>>(new Set())
  const [drawMode, setDrawMode] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [namingRegion, setNamingRegion] = useState(false)
  const [newRegionName, setNewRegionName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sortedSegments = useMemo(() => {
    const withIndex = segments.map((seg, origIdx) => ({ seg, origIdx }))
    withIndex.sort((a, b) => b.seg.area_pixels - a.seg.area_pixels)
    return withIndex
  }, [segments])

  useEffect(() => {
    if (segments.length > 0) return
    handleDetect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDetect = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await fetch('/api/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSegments(data.segments)
    } catch (err) {
      console.error('Segmentation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImgSize({ width: img.clientWidth, height: img.clientHeight })
  }

  const polygonPoints = (segment: Segment) =>
    segment.mask_polygon
      .map(([x, y]) => `${x * imgSize.width},${y * imgSize.height}`)
      .join(' ')

  const getSvgCoords = useCallback(
    (e: React.MouseEvent | MouseEvent): { x: number; y: number } | null => {
      if (!svgRef.current || imgSize.width === 0) return null
      const rect = svgRef.current.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left) / imgSize.width,
        y: (e.clientY - rect.top) / imgSize.height,
      }
    },
    [imgSize]
  )

  const ensureSimplified = useCallback(
    (label: string) => {
      if (simplifiedRef.current.has(label)) return
      const seg = segments.find((s) => s.label === label)
      if (seg && seg.mask_polygon.length > 20) {
        updateSegmentPolygon(label, simplifyPolygon(seg.mask_polygon))
      }
      simplifiedRef.current.add(label)
    },
    [segments, updateSegmentPolygon]
  )

  const handleVertexMouseDown = (
    e: React.MouseEvent,
    label: string,
    vertexIndex: number
  ) => {
    e.stopPropagation()
    e.preventDefault()
    setDragging({ label, vertexIndex })
    selectRegion(label)
  }

  const handleVertexDoubleClick = (
    e: React.MouseEvent,
    label: string,
    vertexIndex: number
  ) => {
    e.stopPropagation()
    e.preventDefault()
    const seg = segments.find((s) => s.label === label)
    if (!seg || seg.mask_polygon.length <= 3) return
    const newPoly = seg.mask_polygon.filter((_, i) => i !== vertexIndex)
    updateSegmentPolygon(label, newPoly)
  }

  const handleEdgeClick = useCallback(
    (e: React.MouseEvent, label: string) => {
      if (!editMode || drawMode || dragging) return
      e.stopPropagation()
      const coords = getSvgCoords(e)
      if (!coords) return
      const seg = segments.find((s) => s.label === label)
      if (!seg) return
      const { afterIndex, point } = closestEdgeInsert(seg.mask_polygon, coords.x, coords.y)
      const newPoly = [...seg.mask_polygon]
      newPoly.splice(afterIndex + 1, 0, point)
      updateSegmentPolygon(label, newPoly)
      selectRegion(label)
    },
    [editMode, drawMode, dragging, getSvgCoords, segments, updateSegmentPolygon, selectRegion]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return
      const coords = getSvgCoords(e)
      if (!coords) return

      const seg = segments.find((s) => s.label === dragging.label)
      if (!seg) return

      const newPolygon: [number, number][] = seg.mask_polygon.map(([ox, oy], idx) => {
        if (idx === dragging.vertexIndex) {
          return [
            Math.max(0, Math.min(1, coords.x)),
            Math.max(0, Math.min(1, coords.y)),
          ] as [number, number]
        }
        return [ox, oy] as [number, number]
      })

      updateSegmentPolygon(dragging.label, newPolygon)
    },
    [dragging, getSvgCoords, segments, updateSegmentPolygon]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  useEffect(() => {
    if (!dragging) return
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!selectedRegion || !editMode) return
      e.preventDefault()

      const segment = segments.find((s) => s.label === selectedRegion)
      if (!segment) return

      const scale = e.deltaY < 0 ? 1.03 : 0.97

      const cx =
        segment.mask_polygon.reduce((sum, [x]) => sum + x, 0) /
        segment.mask_polygon.length
      const cy =
        segment.mask_polygon.reduce((sum, [, y]) => sum + y, 0) /
        segment.mask_polygon.length

      const newPolygon = segment.mask_polygon.map(([x, y]) => {
        const nx = cx + (x - cx) * scale
        const ny = cy + (y - cy) * scale
        return [
          Math.max(0, Math.min(1, nx)),
          Math.max(0, Math.min(1, ny)),
        ] as [number, number]
      })

      updateSegmentPolygon(selectedRegion, newPolygon)
    },
    [selectedRegion, editMode, segments, updateSegmentPolygon]
  )

  const handleDrawMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!drawMode || dragging || namingRegion) return
      const coords = getSvgCoords(e)
      if (!coords) return
      setDrawStart(coords)
      setDrawEnd(coords)
      setIsDrawing(true)
    },
    [drawMode, dragging, namingRegion, getSvgCoords]
  )

  const handleDrawMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawMode || !isDrawing || !drawStart) return
      const coords = getSvgCoords(e)
      if (!coords) return
      setDrawEnd({
        x: Math.max(0, Math.min(1, coords.x)),
        y: Math.max(0, Math.min(1, coords.y)),
      })
    },
    [drawMode, isDrawing, drawStart, getSvgCoords]
  )

  const handleDrawMouseUp = useCallback(() => {
    if (!drawMode || !isDrawing || !drawStart || !drawEnd) return
    setIsDrawing(false)
    const minSize = 0.02
    const w = Math.abs(drawEnd.x - drawStart.x)
    const h = Math.abs(drawEnd.y - drawStart.y)
    if (w < minSize || h < minSize) {
      setDrawStart(null)
      setDrawEnd(null)
      return
    }
    setNamingRegion(true)
    setNewRegionName('')
  }, [drawMode, isDrawing, drawStart, drawEnd])

  const confirmNewRegion = () => {
    if (!drawStart || !drawEnd || !newRegionName.trim()) return

    const x1 = Math.min(drawStart.x, drawEnd.x)
    const y1 = Math.min(drawStart.y, drawEnd.y)
    const x2 = Math.max(drawStart.x, drawEnd.x)
    const y2 = Math.max(drawStart.y, drawEnd.y)

    const label = newRegionName.trim().toLowerCase().replace(/\s+/g, '_')

    const existing = segments.find((s) => s.label === label)
    if (existing) {
      setNewRegionName('')
      return
    }

    const polygon: [number, number][] = [
      [x1, y1],
      [x2, y1],
      [x2, y2],
      [x1, y2],
    ]

    const newSegment: Segment = {
      label,
      mask_polygon: polygon,
      bbox: [x1, y1, x2, y2],
      area_pixels: Math.round(
        (x2 - x1) * imgSize.width * (y2 - y1) * imgSize.height
      ),
      confidence: 1.0,
    }

    addSegment(newSegment)
    setDrawStart(null)
    setDrawEnd(null)
    setIsDrawing(false)
    setNamingRegion(false)
    setNewRegionName('')
    setDrawMode(false)
    setEditMode(true)
  }

  const cancelNewRegion = () => {
    setDrawStart(null)
    setDrawEnd(null)
    setIsDrawing(false)
    setNamingRegion(false)
    setNewRegionName('')
  }

  const startEditingLabel = (label: string) => {
    setEditingLabel(label)
    setEditNameValue(label.replace(/_/g, ' '))
    setRenameError(null)
  }

  const confirmLabelEdit = () => {
    if (!editingLabel) return
    const success = updateSegmentLabel(editingLabel, editNameValue)
    if (!success) {
      setRenameError('Name is empty or already in use')
      return
    }
    if (simplifiedRef.current.has(editingLabel)) {
      simplifiedRef.current.delete(editingLabel)
    }
    setEditingLabel(null)
    setEditNameValue('')
    setRenameError(null)
  }

  const cancelLabelEdit = () => {
    setEditingLabel(null)
    setEditNameValue('')
    setRenameError(null)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#C4622D]" />
        <p className="text-[#1C2B3A]/60">Detecting architectural regions...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <div
          ref={containerRef}
          className={`relative rounded-2xl overflow-hidden border ${
            drawMode
              ? 'border-emerald-400 ring-2 ring-emerald-200'
              : 'border-[#1C2B3A]/10'
          }`}
          onWheel={handleWheel}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalImageUrl}
            alt="House exterior"
            className="w-full h-auto"
            onLoad={handleImageLoad}
            draggable={false}
          />
          {imgSize.width > 0 && (
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${imgSize.width} ${imgSize.height}`}
              style={{
                cursor: drawMode
                  ? 'crosshair'
                  : dragging
                    ? 'grabbing'
                    : undefined,
              }}
              onMouseDown={drawMode ? handleDrawMouseDown : undefined}
              onMouseMove={drawMode ? handleDrawMouseMove : undefined}
              onMouseUp={drawMode ? handleDrawMouseUp : undefined}
            >
              {/* Mask definitions: cut smaller segments out of larger ones */}
              <defs>
                {sortedSegments.map(({ seg }, sortIdx) => {
                  const higherSegments = sortedSegments.slice(sortIdx + 1)
                  if (higherSegments.length === 0) return null
                  return (
                    <mask id={`seg-mask-${seg.label}`} key={`mask-${seg.label}`}>
                      <rect width={imgSize.width} height={imgSize.height} fill="white" />
                      {higherSegments.map(({ seg: s }) => (
                        <polygon key={s.label} points={polygonPoints(s)} fill="black" />
                      ))}
                    </mask>
                  )
                })}
              </defs>
              {/* Largest polygons first, smallest on top; selected always on top */}
              {sortedSegments.map(({ seg, origIdx }, sortIdx) => {
                if (selectedRegion === seg.label) return null
                const hasHigher = sortIdx < sortedSegments.length - 1
                return (
                  <polygon
                    key={seg.label}
                    points={polygonPoints(seg)}
                    fill={REGION_COLORS[origIdx % REGION_COLORS.length]}
                    stroke={REGION_BORDERS[origIdx % REGION_BORDERS.length]}
                    strokeWidth={1.5}
                    mask={hasHigher ? `url(#seg-mask-${seg.label})` : undefined}
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => {
                      if (drawMode) return
                      selectRegion(seg.label)
                      if (editMode) ensureSimplified(seg.label)
                    }}
                  />
                )
              })}
              {/* Selected polygon on top of all others */}
              {sortedSegments.map(({ seg, origIdx }, sortIdx) => {
                if (selectedRegion !== seg.label) return null
                const hasHigher = sortIdx < sortedSegments.length - 1
                return (
                  <polygon
                    key={`${seg.label}-selected`}
                    points={polygonPoints(seg)}
                    fill={REGION_COLORS[origIdx % REGION_COLORS.length]}
                    stroke={REGION_BORDERS[origIdx % REGION_BORDERS.length]}
                    strokeWidth={3}
                    mask={hasHigher ? `url(#seg-mask-${seg.label})` : undefined}
                    className="cursor-pointer transition-all"
                    onClick={(e) => {
                      if (drawMode) return
                      if (editMode) {
                        handleEdgeClick(e, seg.label)
                      }
                    }}
                  />
                )
              })}
              {/* Handles on top of everything */}
              {editMode &&
                sortedSegments.map(({ seg, origIdx }) =>
                  selectedRegion === seg.label
                    ? seg.mask_polygon.map(([x, y], vi) => (
                        <circle
                          key={`${seg.label}-${vi}`}
                          cx={x * imgSize.width}
                          cy={y * imgSize.height}
                          r={VERTEX_RADIUS}
                          fill="#fff"
                          stroke={REGION_BORDERS[origIdx % REGION_BORDERS.length]}
                          strokeWidth={2}
                          className="cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) =>
                            handleVertexMouseDown(e, seg.label, vi)
                          }
                          onDoubleClick={(e) =>
                            handleVertexDoubleClick(e, seg.label, vi)
                          }
                        />
                      ))
                    : null
                )}
              {drawMode && drawStart && drawEnd && (
                <rect
                  x={Math.min(drawStart.x, drawEnd.x) * imgSize.width}
                  y={Math.min(drawStart.y, drawEnd.y) * imgSize.height}
                  width={Math.abs(drawEnd.x - drawStart.x) * imgSize.width}
                  height={Math.abs(drawEnd.y - drawStart.y) * imgSize.height}
                  fill="rgba(16, 185, 129, 0.25)"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                />
              )}
            </svg>
          )}
        </div>

        {/* Naming dialog */}
        {namingRegion && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
            <PenTool className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-sm text-emerald-800 font-medium whitespace-nowrap">
              Name this region:
            </span>
            <Input
              autoFocus
              placeholder="e.g. side_wall, pillar, parapet"
              value={newRegionName}
              onChange={(e) => setNewRegionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmNewRegion()
                if (e.key === 'Escape') cancelNewRegion()
              }}
              className="h-8 text-sm flex-1"
            />
            <Button
              size="sm"
              onClick={confirmNewRegion}
              disabled={!newRegionName.trim()}
              className="h-8 bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelNewRegion}
              className="h-8"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <Button
            variant={drawMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDrawMode(!drawMode)
              if (!drawMode) setEditMode(false)
              setDrawStart(null)
              setDrawEnd(null)
              setIsDrawing(false)
              setNamingRegion(false)
            }}
            className={drawMode ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            <PenTool className="mr-1.5 h-3.5 w-3.5" />
            {drawMode ? 'Drawing...' : 'Add Region'}
          </Button>
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              const entering = !editMode
              setEditMode(entering)
              if (entering) {
                setDrawMode(false)
                if (selectedRegion) ensureSimplified(selectedRegion)
              }
            }}
            className={editMode ? 'bg-[#C4622D] hover:bg-[#a85225]' : ''}
          >
            <Move className="mr-1.5 h-3.5 w-3.5" />
            {editMode ? 'Editing On' : 'Edit Regions'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDetect}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Re-detect
          </Button>
        </div>

        {drawMode && !namingRegion && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <Info className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-700 space-y-0.5">
              <p><strong>Click and drag</strong> on the image to draw a rectangular region</p>
              <p>You&apos;ll be asked to name it after drawing</p>
              <p>You can reshape it afterwards using Edit mode</p>
            </div>
          </div>
        )}

        {editMode && (
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-0.5">
              <p><strong>Drag</strong> a handle to move that point</p>
              <p><strong>Click on edge</strong> to add a new handle</p>
              <p><strong>Double-click</strong> a handle to remove it</p>
              <p><strong>Scroll</strong> over a selected region to resize it</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading">Detected Regions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {segments.length === 0 ? (
              <p className="text-sm text-[#1C2B3A]/50">No regions detected yet.</p>
            ) : (
              <>
                {renameError && (
                  <p className="text-xs text-red-500">{renameError}</p>
                )}
                {segments.map((segment, i) => (
                <div
                  key={segment.label}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    selectedRegion === segment.label
                      ? 'bg-[#C4622D]/10 ring-1 ring-[#C4622D]/30'
                      : 'hover:bg-[#1C2B3A]/5'
                  }`}
                >
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        REGION_BORDERS[i % REGION_BORDERS.length],
                    }}
                  />
                  {editingLabel === segment.label ? (
                    <div className="flex flex-1 items-center gap-1.5 min-w-0">
                      <Input
                        autoFocus
                        value={editNameValue}
                        onChange={(e) => {
                          setEditNameValue(e.target.value)
                          setRenameError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmLabelEdit()
                          if (e.key === 'Escape') cancelLabelEdit()
                        }}
                        className="h-7 text-sm flex-1 min-w-0"
                        placeholder="Region name"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={confirmLabelEdit}
                        disabled={!editNameValue.trim()}
                        className="h-7 w-7 p-0"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelLabelEdit}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          selectRegion(segment.label)
                          if (editMode) ensureSimplified(segment.label)
                        }}
                        className="flex items-center gap-2 flex-1 text-left min-w-0"
                      >
                        <span className="flex-1 font-medium capitalize truncate">
                          {segment.label.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {Math.round(segment.confidence * 100)}%
                        </Badge>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditingLabel(segment.label)
                        }}
                        className="h-7 w-7 rounded-md flex items-center justify-center text-[#1C2B3A]/30 hover:text-[#C4622D] hover:bg-[#C4622D]/10 transition-colors"
                        title={`Rename ${segment.label}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  {editingLabel !== segment.label && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSegment(segment.label)
                      }}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-[#1C2B3A]/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title={`Remove ${segment.label}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              </>
            )}
          </CardContent>
        </Card>

        {segments.length > 0 && (
          <Button
            onClick={async () => {
              setIsSaving(true)
              await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
              await saveSegmentsToDb()
              startTransition(() => {
                nextStep()
              })
            }}
            disabled={isSaving || isPending}
            className="w-full bg-[#C4622D] hover:bg-[#a85225]"
          >
            {isSaving || isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {isSaving || isPending ? 'Saving...' : 'Confirm Regions — Choose Materials'}
          </Button>
        )}
      </div>
    </div>
  )
}
