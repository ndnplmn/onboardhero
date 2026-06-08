-- 30/60/90-day co-created goals tied to check-in milestones
CREATE TABLE IF NOT EXISTS journey_goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id   UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  milestone    TEXT NOT NULL CHECK (milestone IN ('day_30', 'day_60', 'day_90')),
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_goals_journey ON journey_goals(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_goals_milestone ON journey_goals(journey_id, milestone);

ALTER TABLE journey_goals ENABLE ROW LEVEL SECURITY;

-- Hires can see and update their own goals
CREATE POLICY "hire_goals_select" ON journey_goals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM journeys WHERE journeys.id = journey_goals.journey_id
      AND journeys.employee_id = auth.uid()
  ));

-- Managers can see goals for their journeys
CREATE POLICY "manager_goals_select" ON journey_goals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM journeys WHERE journeys.id = journey_goals.journey_id
      AND journeys.manager_id = auth.uid()
  ));

-- Hires and managers can insert/update goals
CREATE POLICY "goals_write" ON journey_goals FOR ALL
  USING (
    EXISTS (SELECT 1 FROM journeys WHERE journeys.id = journey_goals.journey_id
      AND (journeys.employee_id = auth.uid() OR journeys.manager_id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM journeys WHERE journeys.id = journey_goals.journey_id
      AND (journeys.employee_id = auth.uid() OR journeys.manager_id = auth.uid()))
  );

-- HR admins can manage all
CREATE POLICY "hr_goals_all" ON journey_goals FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'hr'));
