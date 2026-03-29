-- ============================================
-- Migration: Full Functionality
-- ============================================

-- 1. Extend profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- 2. Extend journey_tasks table
ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. Extend resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS read_by UUID[] NOT NULL DEFAULT '{}';

-- 4. Onboarding Forms
CREATE TABLE IF NOT EXISTS onboarding_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  department TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Form Submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES onboarding_forms(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Feedback Surveys
CREATE TABLE IF NOT EXISTS feedback_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone milestone_type NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_employee ON form_submissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_feedback_surveys_journey ON feedback_surveys(journey_id);
CREATE INDEX IF NOT EXISTS idx_feedback_surveys_employee ON feedback_surveys(employee_id);

-- RLS
ALTER TABLE onboarding_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_surveys ENABLE ROW LEVEL SECURITY;

-- Onboarding Forms policies
CREATE POLICY "HR manages forms" ON onboarding_forms FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr'));

CREATE POLICY "All authenticated read forms" ON onboarding_forms FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Form Submissions policies
CREATE POLICY "Employee manages own submissions" ON form_submissions FOR ALL
  USING (employee_id = auth.uid());

CREATE POLICY "HR views all submissions" ON form_submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr'));

CREATE POLICY "Manager views assigned submissions" ON form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = form_submissions.journey_id
      AND journeys.manager_id = auth.uid()
    )
  );

-- Feedback Surveys policies
CREATE POLICY "Employee manages own feedback" ON feedback_surveys FOR ALL
  USING (employee_id = auth.uid());

CREATE POLICY "HR views all feedback" ON feedback_surveys FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr'));

CREATE POLICY "Manager views assigned feedback" ON feedback_surveys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = feedback_surveys.journey_id
      AND journeys.manager_id = auth.uid()
    )
  );

-- Manager update policy for journey_tasks (for approval and notes)
CREATE POLICY "Manager updates assigned tasks" ON journey_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = journey_tasks.journey_id
      AND journeys.manager_id = auth.uid()
    )
  );
