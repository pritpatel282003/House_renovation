'use client'

import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Loader2, ImageIcon } from 'lucide-react'
import RegionPreview from '@/components/RegionPreview'
import { fetchMaterials as fetchMaterialsApi, assignMaterials } from '@/lib/api'
import type { Material } from '@/lib/types'

const categories = [
  { value: 'all', label: 'All' },
  { value: 'paint', label: 'Paint' },
  { value: 'cladding', label: 'Cladding' },
  { value: 'tile', label: 'Tile' },
  { value: 'railing', label: 'Railing' },
  { value: 'texture', label: 'Texture' },
  { value: 'panel', label: 'Panel' },
  { value: 'glass', label: 'Glass' },
  { value: 'window', label: 'Window' },
]

export default function MaterialCatalog() {
  const {
    projectId,
    originalImageUrl,
    segments,
    selectedRegion,
    materialAssignments,
    assignMaterial,
    selectRegion,
    nextStep,
    setLoading,
    isLoading,
  } = useProjectStore()

  const [materials, setMaterials] = useState<Material[]>([])
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetchMaterials()
  }, [])

  useEffect(() => {
    if (selectedRegion || segments.length === 0) return
    const firstUnassigned = segments.find((s) => !materialAssignments[s.label])
    selectRegion(firstUnassigned?.label ?? segments[0].label)
  }, [selectedRegion, segments, materialAssignments, selectRegion])

  const selectedSegment = segments.find((s) => s.label === selectedRegion)

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const data = await fetchMaterialsApi()
      setMaterials(data)
    } catch (err) {
      console.error('Failed to fetch materials:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered =
    activeCategory === 'all'
      ? materials
      : materials.filter((m) => m.category === activeCategory)

  const assignedCount = Object.keys(materialAssignments).length
  const totalRegions = segments.length

  const handleAssign = async (material: Material) => {
    if (!selectedRegion || !projectId) return
    assignMaterial(selectedRegion, material)

    const nextUnassigned = segments.find(
      (s) => s.label !== selectedRegion && !materialAssignments[s.label]
    )
    if (nextUnassigned) {
      selectRegion(nextUnassigned.label)
    }
  }

  const handleSaveAndContinue = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const assignments: Record<string, string> = {}
      for (const [label, material] of Object.entries(materialAssignments)) {
        assignments[label] = material.id
      }

      await assignMaterials(projectId, assignments)
      nextStep()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Region selector */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-[#1C2B3A]/60 mr-2">Assign to:</span>
        {segments.map((segment) => {
          const isAssigned = !!materialAssignments[segment.label]
          const isSelected = selectedRegion === segment.label
          return (
            <button
              key={segment.label}
              onClick={() => selectRegion(segment.label)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                isSelected
                  ? 'border-[#C4622D] bg-[#C4622D]/10 text-[#C4622D]'
                  : isAssigned
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-[#1C2B3A]/10 text-[#1C2B3A]/60 hover:border-[#C4622D]/30'
              }`}
            >
              {isAssigned && <Check className="h-3 w-3" />}
              <span className="capitalize">{segment.label.replace(/_/g, ' ')}</span>
            </button>
          )
        })}
      </div>

      {selectedSegment && originalImageUrl && (
        <RegionPreview
          imageUrl={originalImageUrl}
          segment={selectedSegment}
        />
      )}

      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-sm">
          {assignedCount} of {totalRegions} regions assigned
        </Badge>
        {selectedRegion && materialAssignments[selectedRegion] && (
          <p className="text-sm text-[#1C2B3A]/60">
            Current:{' '}
            <span className="font-medium text-[#1C2B3A]">
              {materialAssignments[selectedRegion].name}
            </span>
          </p>
        )}
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Materials grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#C4622D]" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((material) => {
            const isAssignedToSelected =
              selectedRegion && materialAssignments[selectedRegion]?.id === material.id
            return (
              <Card
                key={material.id}
                className={`group cursor-pointer overflow-hidden transition-all hover:shadow-md ${
                  isAssignedToSelected
                    ? 'ring-2 ring-[#C4622D] border-[#C4622D]'
                    : 'border-[#1C2B3A]/5'
                }`}
                onClick={() => handleAssign(material)}
              >
                <div className="aspect-[4/3] bg-[#1C2B3A]/5 relative overflow-hidden">
                  {material.texture_cloudinary_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={material.texture_cloudinary_url}
                      alt={material.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-[#1C2B3A]/20" />
                    </div>
                  )}
                  {isAssignedToSelected && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#C4622D] flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium text-[#1C2B3A] truncate">
                    {material.name}
                  </p>
                  <p className="text-xs text-[#1C2B3A]/50 mt-0.5">
                    INR {material.material_rate_per_unit}/{material.unit}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Continue button */}
      <Button
        onClick={handleSaveAndContinue}
        disabled={assignedCount === 0 || isLoading}
        className="w-full bg-[#C4622D] hover:bg-[#a85225]"
        size="lg"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Check className="mr-2 h-4 w-4" />
        )}
        Save & Visualize ({assignedCount}/{totalRegions} assigned)
      </Button>
    </div>
  )
}
