import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function getHRDashboardData() {
  const supabase = await createSupabaseServer()

  const [journeysRes, tasksRes, profilesRes] = await Promise.all([
    supabase
      .from('journeys')
      .select('id, status, current_week, risk_score, start_date, employee:profiles!employee_id(id, full_name, department, avatar_url), manager:profiles!manager_id(id, full_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('journey_tasks')
      .select('journey_id, status, week, assigned_to_role'),
    supabase
      .from('profiles')
      .select('id, role, department, active')
      .eq('active', true),
  ])

  return {
    journeys:  journeysRes.data  || [],
    tasks:     tasksRes.data     || [],
    profiles:  profilesRes.data  || [],
  }
}
