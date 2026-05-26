ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE project_rate_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_rate_overrides"
  ON project_rate_overrides FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materials_public_read"
  ON materials FOR SELECT
  USING (true);
