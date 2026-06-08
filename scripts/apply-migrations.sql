-- ============================================================
-- OnboardHero — Missing Migrations
-- ============================================================
-- Run this ONCE in the Supabase SQL Editor (Dashboard > SQL Editor)
-- before running seed-demo.mjs
-- Safe to run multiple times (idempotent).
-- ============================================================

-- ── pulse_checks ────────────────────────────────────────────
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pulse_checks' AND policyname = 'Employees insert own pulse checks') THEN
    CREATE POLICY "Employees insert own pulse checks" ON pulse_checks FOR INSERT WITH CHECK (auth.uid() = employee_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pulse_checks' AND policyname = 'Employees view own pulse checks') THEN
    CREATE POLICY "Employees view own pulse checks" ON pulse_checks FOR SELECT USING (auth.uid() = employee_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pulse_checks' AND policyname = 'Managers view assigned pulse checks') THEN
    CREATE POLICY "Managers view assigned pulse checks" ON pulse_checks FOR SELECT USING (
      EXISTS (SELECT 1 FROM journeys WHERE journeys.id = pulse_checks.journey_id AND journeys.manager_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pulse_checks' AND policyname = 'HR views all pulse checks') THEN
    CREATE POLICY "HR views all pulse checks" ON pulse_checks FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
    );
  END IF;
END $$;

-- ── action_log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS action_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id  UUID        NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  actor_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role  TEXT        NOT NULL CHECK (actor_role IN ('hire', 'manager', 'hr', 'system')),
  action_type TEXT        NOT NULL,
  label       TEXT        NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS action_log_journey_id_idx ON action_log(journey_id, created_at DESC);

ALTER TABLE action_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'action_log' AND policyname = 'hire_read_own_action_log') THEN
    CREATE POLICY "hire_read_own_action_log" ON action_log FOR SELECT USING (
      journey_id IN (SELECT id FROM journeys WHERE employee_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'action_log' AND policyname = 'manager_read_team_action_log') THEN
    CREATE POLICY "manager_read_team_action_log" ON action_log FOR SELECT USING (
      journey_id IN (SELECT id FROM journeys WHERE manager_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'action_log' AND policyname = 'hr_read_all_action_log') THEN
    CREATE POLICY "hr_read_all_action_log" ON action_log FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'action_log' AND policyname = 'service_insert_action_log') THEN
    CREATE POLICY "service_insert_action_log" ON action_log FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── journey_goals ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journey_goals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id  UUID        NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  milestone   TEXT        NOT NULL CHECK (milestone IN ('day_30', 'day_60', 'day_90')),
  title       TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journey_goals_journey   ON journey_goals(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_goals_milestone ON journey_goals(journey_id, milestone);

ALTER TABLE journey_goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journey_goals' AND policyname = 'hire_goals_select') THEN
    CREATE POLICY "hire_goals_select" ON journey_goals FOR SELECT USING (
      EXISTS (SELECT 1 FROM journeys WHERE journeys.id = journey_goals.journey_id AND journeys.employee_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journey_goals' AND policyname = 'manager_goals_select') THEN
    CREATE POLICY "manager_goals_select" ON journey_goals FOR SELECT USING (
      EXISTS (SELECT 1 FROM journeys WHERE journeys.id = journey_goals.journey_id AND journeys.manager_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journey_goals' AND policyname = 'goals_write') THEN
    CREATE POLICY "goals_write" ON journey_goals FOR ALL
      USING (EXISTS (SELECT 1 FROM journeys WHERE journeys.id = journey_goals.journey_id
        AND (journeys.employee_id = auth.uid() OR journeys.manager_id = auth.uid())))
      WITH CHECK (EXISTS (SELECT 1 FROM journeys WHERE journeys.id = journey_goals.journey_id
        AND (journeys.employee_id = auth.uid() OR journeys.manager_id = auth.uid())));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journey_goals' AND policyname = 'hr_goals_all') THEN
    CREATE POLICY "hr_goals_all" ON journey_goals FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'hr')
    );
  END IF;
END $$;

-- ── manager_notes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manager_notes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id  UUID        NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  manager_id  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  content     TEXT        NOT NULL,
  source      TEXT        NOT NULL DEFAULT 'note' CHECK (source IN ('positive', 'constructive', 'note')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manager_notes_journey ON manager_notes(journey_id, created_at DESC);

ALTER TABLE manager_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manager_notes' AND policyname = 'hire_read_own_manager_notes') THEN
    CREATE POLICY "hire_read_own_manager_notes" ON manager_notes FOR SELECT USING (
      journey_id IN (SELECT id FROM journeys WHERE employee_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manager_notes' AND policyname = 'manager_manage_notes') THEN
    CREATE POLICY "manager_manage_notes" ON manager_notes FOR ALL USING (manager_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manager_notes' AND policyname = 'hr_read_all_manager_notes') THEN
    CREATE POLICY "hr_read_all_manager_notes" ON manager_notes FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manager_notes' AND policyname = 'service_insert_manager_notes') THEN
    CREATE POLICY "service_insert_manager_notes" ON manager_notes FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── feedback_surveys ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_surveys (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id  UUID           NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  employee_id UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone   milestone_type NOT NULL,
  rating      INT            NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments    TEXT,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_surveys_journey  ON feedback_surveys(journey_id);
CREATE INDEX IF NOT EXISTS idx_feedback_surveys_employee ON feedback_surveys(employee_id);

ALTER TABLE feedback_surveys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback_surveys' AND policyname = 'hr_all_feedback_surveys') THEN
    CREATE POLICY "hr_all_feedback_surveys" ON feedback_surveys FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback_surveys' AND policyname = 'employee_own_feedback') THEN
    CREATE POLICY "employee_own_feedback" ON feedback_surveys FOR ALL USING (employee_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback_surveys' AND policyname = 'service_insert_feedback') THEN
    CREATE POLICY "service_insert_feedback" ON feedback_surveys FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── Extra check_ins columns ─────────────────────────────────
-- The app queries 'manager_notes' on check-ins
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS manager_notes TEXT;

-- ── Extra profile columns ────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT;
