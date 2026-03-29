-- ============================================
-- OnboardHero Database Schema
-- ============================================

-- Enums
CREATE TYPE user_role AS ENUM ('hr', 'manager', 'new_hire');
CREATE TYPE journey_status AS ENUM ('not_started', 'in_progress', 'completed', 'at_risk');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE milestone_type AS ENUM ('day_7', 'day_14', 'day_30', 'day_60', 'day_90');
CREATE TYPE notification_type AS ENUM ('nudge', 'risk_alert', 'milestone', 'task_due', 'checkin_reminder');
CREATE TYPE resource_type AS ENUM ('document', 'video', 'link', 'contact');

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'new_hire',
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Journey Templates
CREATE TABLE journey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  role_type TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  duration_days INT NOT NULL DEFAULT 90,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Template Tasks
CREATE TABLE template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES journey_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  week INT NOT NULL CHECK (week >= 1 AND week <= 12),
  assigned_to_role user_role NOT NULL DEFAULT 'new_hire',
  "order" INT NOT NULL DEFAULT 0
);

-- Journeys
CREATE TABLE journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES journey_templates(id) ON DELETE RESTRICT,
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status journey_status NOT NULL DEFAULT 'not_started',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_week INT NOT NULL DEFAULT 1,
  risk_score INT NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  sentiment_score FLOAT NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Journey Tasks
CREATE TABLE journey_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  template_task_id UUID REFERENCES template_tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  week INT NOT NULL,
  assigned_to_role user_role NOT NULL DEFAULT 'new_hire',
  status task_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Check-ins
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  milestone milestone_type NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  ai_agenda TEXT,
  ai_summary TEXT,
  notes TEXT
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resources
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type resource_type NOT NULL DEFAULT 'document',
  content TEXT,
  url TEXT,
  department TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Conversations
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  preset TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_journeys_employee ON journeys(employee_id);
CREATE INDEX idx_journeys_manager ON journeys(manager_id);
CREATE INDEX idx_journeys_status ON journeys(status);
CREATE INDEX idx_journey_tasks_journey ON journey_tasks(journey_id);
CREATE INDEX idx_journey_tasks_status ON journey_tasks(status);
CREATE INDEX idx_check_ins_journey ON check_ins(journey_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "HR views all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
  );

CREATE POLICY "Managers view assigned new hires"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.manager_id = auth.uid()
      AND journeys.employee_id = profiles.id
    )
  );

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "HR inserts profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
  );

-- Journey Templates policies
CREATE POLICY "HR manages templates"
  ON journey_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
  );

CREATE POLICY "All authenticated read templates"
  ON journey_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Template Tasks policies
CREATE POLICY "HR manages template tasks"
  ON template_tasks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
  );

CREATE POLICY "All authenticated read template tasks"
  ON template_tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Journeys policies
CREATE POLICY "Employee views own journey"
  ON journeys FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Manager views assigned journeys"
  ON journeys FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "HR manages all journeys"
  ON journeys FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
  );

-- Journey Tasks policies
CREATE POLICY "Employee views own tasks"
  ON journey_tasks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM journeys WHERE journeys.id = journey_tasks.journey_id AND journeys.employee_id = auth.uid())
  );

CREATE POLICY "Employee updates own tasks"
  ON journey_tasks FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM journeys WHERE journeys.id = journey_tasks.journey_id AND journeys.employee_id = auth.uid())
  );

CREATE POLICY "Manager views assigned tasks"
  ON journey_tasks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM journeys WHERE journeys.id = journey_tasks.journey_id AND journeys.manager_id = auth.uid())
  );

CREATE POLICY "HR manages all tasks"
  ON journey_tasks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
  );

-- Check-ins policies
CREATE POLICY "Manager manages own check-ins"
  ON check_ins FOR ALL
  USING (manager_id = auth.uid());

CREATE POLICY "Employee views own check-ins"
  ON check_ins FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM journeys WHERE journeys.id = check_ins.journey_id AND journeys.employee_id = auth.uid())
  );

CREATE POLICY "HR manages all check-ins"
  ON check_ins FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
  );

-- Notifications policies
CREATE POLICY "Users manage own notifications"
  ON notifications FOR ALL
  USING (user_id = auth.uid());

-- Resources policies
CREATE POLICY "All authenticated read resources"
  ON resources FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "HR manages resources"
  ON resources FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr')
  );

-- AI Conversations policies
CREATE POLICY "Users manage own conversations"
  ON ai_conversations FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- Trigger: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'new_hire'::public.user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Function: create journey from template
-- ============================================
CREATE OR REPLACE FUNCTION public.create_journey_from_template(
  p_employee_id UUID,
  p_template_id UUID,
  p_manager_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
  v_journey_id UUID;
  v_milestone milestone_type;
  v_milestone_days INT;
BEGIN
  INSERT INTO journeys (employee_id, template_id, manager_id, start_date, status)
  VALUES (p_employee_id, p_template_id, p_manager_id, p_start_date, 'in_progress')
  RETURNING id INTO v_journey_id;

  INSERT INTO journey_tasks (journey_id, template_task_id, title, description, week, assigned_to_role)
  SELECT v_journey_id, tt.id, tt.title, tt.description, tt.week, tt.assigned_to_role
  FROM template_tasks tt
  WHERE tt.template_id = p_template_id
  ORDER BY tt.week, tt."order";

  FOREACH v_milestone IN ARRAY ARRAY['day_7', 'day_14', 'day_30', 'day_60', 'day_90']::milestone_type[] LOOP
    v_milestone_days := CASE v_milestone
      WHEN 'day_7' THEN 7
      WHEN 'day_14' THEN 14
      WHEN 'day_30' THEN 30
      WHEN 'day_60' THEN 60
      WHEN 'day_90' THEN 90
    END;

    INSERT INTO check_ins (journey_id, manager_id, milestone, scheduled_date)
    VALUES (v_journey_id, p_manager_id, v_milestone, p_start_date + v_milestone_days);
  END LOOP;

  RETURN v_journey_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Enable Realtime for notifications
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- Full Functionality Extensions
-- ============================================

-- Extend profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Extend journey_tasks table
ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Extend resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS read_by UUID[] NOT NULL DEFAULT '{}';

-- Onboarding Forms
CREATE TABLE IF NOT EXISTS onboarding_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  department TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Form Submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES onboarding_forms(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feedback Surveys
CREATE TABLE IF NOT EXISTS feedback_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone milestone_type NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- New table indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_employee ON form_submissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_feedback_surveys_journey ON feedback_surveys(journey_id);
CREATE INDEX IF NOT EXISTS idx_feedback_surveys_employee ON feedback_surveys(employee_id);

-- New table RLS
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
