-- Company-wide configuration, one row per key
CREATE TABLE IF NOT EXISTS company_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HR can read and write; managers / new_hires cannot
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_read_settings"  ON company_settings FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
);
CREATE POLICY "hr_write_settings" ON company_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
);
