-- pulse_checks: stores weekly morale scores submitted by new hires via PulseCheck component
-- The /api/pulse route gracefully handles missing table, so this migration can be applied at any time.

CREATE TABLE IF NOT EXISTS pulse_checks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id  UUID        NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  employee_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week        INT         NOT NULL CHECK (week >= 1),
  score       INT         NOT NULL CHECK (score >= 1 AND score <= 5),
  question    TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, journey_id, week)
);

CREATE INDEX IF NOT EXISTS idx_pulse_checks_journey  ON pulse_checks(journey_id);
CREATE INDEX IF NOT EXISTS idx_pulse_checks_employee ON pulse_checks(employee_id);
CREATE INDEX IF NOT EXISTS idx_pulse_checks_week     ON pulse_checks(employee_id, week);

ALTER TABLE pulse_checks ENABLE ROW LEVEL SECURITY;

-- New hires can insert their own pulse checks
CREATE POLICY "Employees insert own pulse checks"
  ON pulse_checks FOR INSERT
  WITH CHECK (auth.uid() = employee_id);

-- New hires can read their own history
CREATE POLICY "Employees view own pulse checks"
  ON pulse_checks FOR SELECT
  USING (auth.uid() = employee_id);

-- Managers can read pulse checks for journeys they own
CREATE POLICY "Managers view assigned pulse checks"
  ON pulse_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = pulse_checks.journey_id
        AND journeys.manager_id = auth.uid()
    )
  );

-- HR can read all pulse checks
CREATE POLICY "HR views all pulse checks"
  ON pulse_checks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
  );
