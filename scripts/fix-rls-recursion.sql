-- ============================================================
-- Fix: infinite recursion in profiles RLS policies
-- ============================================================
-- Run this ONCE in the Supabase SQL Editor.
-- Safe to run multiple times (idempotent).
-- ============================================================

-- ── 1. Create a SECURITY DEFINER helper ────────────────────
-- This function bypasses RLS when looking up the current user's
-- role, breaking the recursion chain.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()
$$;

-- ── 2. Fix the recursive policy on profiles ─────────────────
DROP POLICY IF EXISTS "HR views all profiles" ON profiles;
CREATE POLICY "HR views all profiles"
  ON profiles FOR SELECT
  USING (public.get_my_role() = 'hr');

DROP POLICY IF EXISTS "HR inserts profiles" ON profiles;
CREATE POLICY "HR inserts profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR public.get_my_role() = 'hr'
  );

-- ── 3. Fix all other tables that use the same recursive pattern ──

-- journey_templates
DROP POLICY IF EXISTS "HR manages templates" ON journey_templates;
CREATE POLICY "HR manages templates"
  ON journey_templates FOR ALL
  USING (public.get_my_role() = 'hr');

-- template_tasks
DROP POLICY IF EXISTS "HR manages template tasks" ON template_tasks;
CREATE POLICY "HR manages template tasks"
  ON template_tasks FOR ALL
  USING (public.get_my_role() = 'hr');

-- journeys
DROP POLICY IF EXISTS "HR manages all journeys" ON journeys;
CREATE POLICY "HR manages all journeys"
  ON journeys FOR ALL
  USING (public.get_my_role() = 'hr');

-- journey_tasks
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journey_tasks' AND policyname = 'HR manages journey tasks') THEN
    DROP POLICY "HR manages journey tasks" ON journey_tasks;
    CREATE POLICY "HR manages journey tasks"
      ON journey_tasks FOR ALL
      USING (public.get_my_role() = 'hr');
  END IF;
END $$;

-- check_ins
DROP POLICY IF EXISTS "HR manages all check-ins" ON check_ins;
CREATE POLICY "HR manages all check-ins"
  ON check_ins FOR ALL
  USING (public.get_my_role() = 'hr');

-- resources
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'resources' AND policyname = 'HR manages resources') THEN
    DROP POLICY "HR manages resources" ON resources;
    CREATE POLICY "HR manages resources"
      ON resources FOR ALL
      USING (public.get_my_role() = 'hr');
  END IF;
END $$;

-- pulse_checks
DROP POLICY IF EXISTS "HR views all pulse checks" ON pulse_checks;
CREATE POLICY "HR views all pulse checks"
  ON pulse_checks FOR SELECT
  USING (public.get_my_role() = 'hr');

-- action_log
DROP POLICY IF EXISTS "hr_read_all_action_log" ON action_log;
CREATE POLICY "hr_read_all_action_log"
  ON action_log FOR SELECT
  USING (public.get_my_role() = 'hr');

-- journey_goals
DROP POLICY IF EXISTS "hr_goals_all" ON journey_goals;
CREATE POLICY "hr_goals_all"
  ON journey_goals FOR ALL
  USING (public.get_my_role() = 'hr');

-- manager_notes
DROP POLICY IF EXISTS "hr_read_all_manager_notes" ON manager_notes;
CREATE POLICY "hr_read_all_manager_notes"
  ON manager_notes FOR SELECT
  USING (public.get_my_role() = 'hr');

-- feedback_surveys
DROP POLICY IF EXISTS "hr_all_feedback_surveys" ON feedback_surveys;
CREATE POLICY "hr_all_feedback_surveys"
  ON feedback_surveys FOR ALL
  USING (public.get_my_role() = 'hr');
