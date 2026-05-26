CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('paint','cladding','tile','railing','texture','panel','glass','window')),
  texture_cloudinary_url TEXT,
  texture_public_id TEXT,
  unit TEXT NOT NULL CHECK (unit IN ('sqft','linear_ft','litre','unit')),
  material_rate_per_unit NUMERIC(10,2) NOT NULL,
  labor_rate_per_unit NUMERIC(10,2) NOT NULL,
  coverage_per_unit NUMERIC(10,2) DEFAULT 1,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'My Renovation Project',
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded','segmented','designed','estimated','completed')),
  original_image_url TEXT,
  original_cloudinary_public_id TEXT,
  redesigned_image_url TEXT,
  redesigned_cloudinary_public_id TEXT,
  segmentation_data JSONB,
  material_assignments JSONB DEFAULT '{}',
  area_data JSONB,
  quantity_data JSONB,
  cost_data JSONB,
  report_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_rate_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id),
  custom_material_rate NUMERIC(10,2),
  custom_labor_rate NUMERIC(10,2),
  UNIQUE(project_id, material_id)
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
