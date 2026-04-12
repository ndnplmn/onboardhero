import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function getManagerDashboardData(managerId: string) {
  const supabase = await createSupabaseServer()

  const [journeysRes, checkInsRes] = await Promise.all([
    supabase
      .from('journeys')
      .select('id, status, current_week, risk_score, start_date, risk_reasons, friction_points, employee:profiles!employee_id(id, full_name, department, avatar_url)')
      .eq('manager_id', managerId)
      .in('status', ['in_progress', 'at_risk', 'not_started', 'active'])
      .order('created_at', { ascending: false }),
    supabase
      .from('check_ins')
      .select('id, journey_id, scheduled_date, journey:journeys!journey_id(employee:profiles!employee_id(full_name))')
      .eq('manager_id', managerId)
      .is('completed_date', null)
      .order('scheduled_date', { ascending: true })
      .limit(5),
  ])

  return {
    journeys:         journeysRes.data  || [],
    upcomingCheckIns: checkInsRes.data  || [],
  }
}

export async function getManagerHiresData(managerId: string) {
  const supabase = await createSupabaseServer()

  const [journeysRes, tasksRes, checkInsRes] = await Promise.all([
    supabase
      .from('journeys')
      .select('id, status, current_week, risk_score, start_date, employee:profiles!employee_id(id, full_name, department, avatar_url)')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false }),
    supabase
      .from('journey_tasks')
      .select('journey_id, status'),
    supabase
      .from('check_ins')
      .select('id, journey_id')
      .eq('manager_id', managerId)
      .is('completed_date', null),
  ])

  return {
    journeys:         journeysRes.data  || [],
    tasks:            tasksRes.data     || [],
    pendingCheckIns:  checkInsRes.data  || [],
  }
}

export async function getTeamMemberDetail(journeyId: string) {
  const supabase = await createSupabaseServer()

  const [journeyRes, tasksRes, checkInsRes] = await Promise.all([
    supabase
      .from('journeys')
      .select('id, status, current_week, risk_score, risk_reasons, start_date, friction_points, employee:profiles!employee_id(id, full_name, department, avatar_url), template:journey_templates!template_id(id, name)')
      .eq('id', journeyId)
      .single(),
    supabase
      .from('journey_tasks')
      .select('id, title, description, week, status, assigned_to_role, due_date, completed_at')
      .eq('journey_id', journeyId)
      .order('week')
      .order('assigned_to_role'),
    supabase
      .from('check_ins')
      .select('id, scheduled_date, completed_date, notes, type')
      .eq('journey_id', journeyId)
      .order('scheduled_date'),
  ])

  return {
    journey:  journeyRes.data,
    tasks:    tasksRes.data   || [],
    checkIns: checkInsRes.data || [],
  }
}
