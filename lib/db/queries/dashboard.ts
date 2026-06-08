import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function getHRDashboardData() {
  const supabase = await createSupabaseServer()

  const [journeysRes, tasksRes, profilesRes, managersRes, templatesRes] = await Promise.all([
    supabase
      .from('journeys')
      .select('id, status, current_week, risk_score, start_date, sentiment_score, friction_points, employee:profiles!employee_id(id, full_name, department, avatar_url), manager:profiles!manager_id(id, full_name), template:journey_templates!template_id(duration_days)')
      .order('created_at', { ascending: false }),
    supabase
      .from('journey_tasks')
      .select('journey_id, status, week, assigned_to_role'),
    supabase
      .from('profiles')
      .select('id, role, department, active')
      .eq('active', true),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'manager')
      .eq('active', true)
      .order('full_name', { ascending: true }),
    supabase
      .from('journey_templates')
      .select('id, name')
      .order('name', { ascending: true }),
  ])

  return {
    journeys:  journeysRes.data  || [],
    tasks:     tasksRes.data     || [],
    profiles:  profilesRes.data  || [],
    managers:  managersRes.data  || [],
    templates: templatesRes.data || [],
  }
}
