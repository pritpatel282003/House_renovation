'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProjectStore } from '@/store/projectStore'
import Navbar from '@/components/Navbar'
import ProjectStepper from '@/components/ProjectStepper'
import ImageUploader from '@/components/ImageUploader'
import SegmentationViewer from '@/components/SegmentationViewer'
import MaterialCatalog from '@/components/MaterialCatalog'
import VisualizationPanel from '@/components/VisualizationPanel'
import CostBreakdownComponent from '@/components/CostBreakdown'
import ReportDownloader from '@/components/ReportDownloader'
import { Loader2 } from 'lucide-react'
import type { Project, Material } from '@/lib/types'

const statusToStep: Record<string, number> = {
  uploaded: 2,
  segmented: 3,
  designed: 4,
  estimated: 5,
  completed: 6,
}

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [loading, setPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const {
    initProject,
    currentStep,
    setStep,
    setSegments,
    setMaterialAssignments,
    setCostData,
    setVisualization,
    setAiDesign,
    setReportUrl,
  } = useProjectStore()

  useEffect(() => {
    const loadProject = async () => {
      const supabase = createClient()
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error || !project) {
        setNotFound(true)
        setPageLoading(false)
        return
      }

      const p = project as Project

      initProject(p.id, p.original_image_url || '')

      if (p.segmentation_data) setSegments(p.segmentation_data)
      if (p.redesigned_image_url) setVisualization(p.redesigned_image_url)
      if (p.ai_designed_image_url) {
        setAiDesign(p.ai_designed_image_url)
      } else if (p.redesigned_image_url) {
        setAiDesign(p.redesigned_image_url)
      }
      if (p.cost_data) setCostData(p.cost_data)
      if (p.report_storage_path) setReportUrl(p.report_storage_path)

      if (p.material_assignments && Object.keys(p.material_assignments).length > 0) {
        const materialIds = Object.values(p.material_assignments)
        const { data: materials } = await supabase
          .from('materials')
          .select('*')
          .in('id', materialIds)

        if (materials && materials.length > 0) {
          const materialMap: Record<string, Material> = {}
          for (const mat of materials) {
            materialMap[mat.id] = mat as Material
          }
          const restored: Record<string, Material> = {}
          for (const [label, matId] of Object.entries(p.material_assignments)) {
            if (materialMap[matId]) {
              restored[label] = materialMap[matId]
            }
          }
          setMaterialAssignments(restored)
        }
      }

      const step = statusToStep[p.status] || 1
      setStep(step)

      setPageLoading(false)
    }

    loadProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#C4622D]" />
        </div>
      </>
    )
  }

  if (notFound) {
    return (
      <>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
          <h2 className="font-heading text-2xl font-bold text-[#1C2B3A]">Project Not Found</h2>
          <p className="text-[#1C2B3A]/60">This project doesn&apos;t exist or you don&apos;t have access.</p>
        </div>
      </>
    )
  }

  const stepTitles: Record<number, string> = {
    1: 'Upload Your House Photo',
    2: 'Detect Regions',
    3: 'Choose Materials',
    4: 'Visualize Redesign',
    5: 'Cost Estimate',
    6: 'Download Report',
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ProjectStepper />

          <div className="mt-6">
            <h2 className="font-heading text-2xl font-bold text-[#1C2B3A] mb-6">
              {stepTitles[currentStep]}
            </h2>

            {currentStep === 1 && <ImageUploader />}
            {currentStep === 2 && <SegmentationViewer />}
            {currentStep === 3 && <MaterialCatalog />}
            {currentStep === 4 && <VisualizationPanel />}
            {currentStep === 5 && <CostBreakdownComponent />}
            {currentStep === 6 && <ReportDownloader />}
          </div>
        </div>
      </main>
    </>
  )
}
