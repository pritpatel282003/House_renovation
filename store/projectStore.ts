import { create } from 'zustand'
import type { Segment, Material, AreaInfo, CostBreakdown } from '@/lib/types'

interface ProjectState {
  projectId: string | null
  currentStep: number
  originalImageUrl: string
  redesignedImageUrl: string
  aiDesignedImageUrl: string
  isAiDesigning: boolean
  segments: Segment[]
  selectedRegion: string | null
  materialAssignments: Record<string, Material>
  areaData: Record<string, AreaInfo>
  costData: CostBreakdown | null
  reportUrl: string | null
  isLoading: boolean
  error: string | null
}

interface ProjectActions {
  initProject: (projectId: string, imageUrl: string) => void
  setSegments: (segments: Segment[]) => void
  addSegment: (segment: Segment) => void
  removeSegment: (label: string) => void
  updateSegmentPolygon: (label: string, polygon: [number, number][]) => void
  selectRegion: (label: string | null) => void
  assignMaterial: (regionLabel: string, material: Material) => void
  setMaterialAssignments: (assignments: Record<string, Material>) => void
  setVisualization: (url: string) => void
  setAiDesign: (url: string) => void
  setAiDesigning: (loading: boolean) => void
  setCostData: (data: CostBreakdown) => void
  setReportUrl: (url: string) => void
  nextStep: () => void
  prevStep: () => void
  setStep: (step: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: ProjectState = {
  projectId: null,
  currentStep: 1,
  originalImageUrl: '',
  redesignedImageUrl: '',
  aiDesignedImageUrl: '',
  isAiDesigning: false,
  segments: [],
  selectedRegion: null,
  materialAssignments: {},
  areaData: {},
  costData: null,
  reportUrl: null,
  isLoading: false,
  error: null,
}

export const useProjectStore = create<ProjectState & ProjectActions>((set) => ({
  ...initialState,

  initProject: (projectId, imageUrl) =>
    set({ ...initialState, projectId, originalImageUrl: imageUrl, currentStep: 1 }),

  setSegments: (segments) => set({ segments }),

  addSegment: (segment) =>
    set((state) => ({
      segments: [...state.segments, segment],
      selectedRegion: segment.label,
    })),

  removeSegment: (label) =>
    set((state) => ({
      segments: state.segments.filter((s) => s.label !== label),
      selectedRegion: state.selectedRegion === label ? null : state.selectedRegion,
    })),

  updateSegmentPolygon: (label, polygon) =>
    set((state) => ({
      segments: state.segments.map((s) =>
        s.label === label ? { ...s, mask_polygon: polygon } : s
      ),
    })),

  selectRegion: (label) => set({ selectedRegion: label }),

  assignMaterial: (regionLabel, material) =>
    set((state) => ({
      materialAssignments: {
        ...state.materialAssignments,
        [regionLabel]: material,
      },
    })),

  setMaterialAssignments: (assignments) => set({ materialAssignments: assignments }),

  setVisualization: (url) => set({ redesignedImageUrl: url }),

  setAiDesign: (url) => set({ aiDesignedImageUrl: url }),

  setAiDesigning: (loading) => set({ isAiDesigning: loading }),

  setCostData: (data) => set({ costData: data }),

  setReportUrl: (url) => set({ reportUrl: url }),

  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 6) })),

  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  setStep: (step) => set({ currentStep: step }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}))

export async function saveSegmentsToDb(): Promise<boolean> {
  const { projectId, segments } = useProjectStore.getState()
  if (!projectId) return false
  try {
    const res = await fetch('/api/save-segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, segments }),
    })
    return res.ok
  } catch {
    return false
  }
}
