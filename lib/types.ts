export interface Material {
  id: string
  name: string
  category: 'paint' | 'cladding' | 'tile' | 'railing' | 'texture' | 'panel' | 'glass'
  texture_cloudinary_url: string | null
  texture_public_id: string | null
  unit: 'sqft' | 'linear_ft' | 'litre'
  material_rate_per_unit: number
  labor_rate_per_unit: number
  coverage_per_unit: number
  description: string | null
  created_at: string
}

export interface Segment {
  label: string
  mask_polygon: [number, number][]
  bbox: [number, number, number, number]
  area_pixels: number
  confidence: number
}

export interface Project {
  id: string
  user_id: string
  title: string
  status: 'uploaded' | 'segmented' | 'designed' | 'estimated' | 'completed'
  original_image_url: string | null
  original_cloudinary_public_id: string | null
  redesigned_image_url: string | null
  redesigned_cloudinary_public_id: string | null
  ai_designed_image_url: string | null
  segmentation_data: Segment[] | null
  material_assignments: Record<string, string>
  area_data: Record<string, AreaInfo> | null
  quantity_data: Record<string, number> | null
  cost_data: CostBreakdown | null
  report_storage_path: string | null
  created_at: string
  updated_at: string
}

export interface MaterialAssignment {
  region_label: string
  material: Material
}

export interface AreaInfo {
  area_sqft: number
  unit: string
}

export interface CostLineItem {
  region: string
  material_name: string
  area_sqft: number
  quantity: number
  unit: string
  material_rate: number
  labor_rate: number
  material_cost: number
  labor_cost: number
  total_cost: number
}

export interface CostBreakdown {
  line_items: CostLineItem[]
  subtotal_material: number
  subtotal_labor: number
  grand_total: number
  wastage_percent: number
}

export interface ProjectRateOverride {
  id: string
  project_id: string
  material_id: string
  custom_material_rate: number | null
  custom_labor_rate: number | null
}
