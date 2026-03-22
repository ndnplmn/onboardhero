import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function getManagerDashboardData(managerId: string) {
  const supabase = await createSupabaseServer()

  const { data: journeys } = await supabase
    .from('journeys')
    .select('*, employee:profiles!employee_id(*)')
    .eq('manager_id', managerId)
    .in('status', ['in_progress', 'at_risk', 'not_started'])
    .order('created_at', { ascending: false })

  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*, journey:journeys!journey_id(employee:profiles!employee_id(full_name))')
    .eq('manager_id', managerId)
    .is('completed_date', null)
    .order('scheduled_date', { ascending: true })
    .limit(5)

  return { journeys: journeys || [], upcomingCheckIns: checkIns || [] }
}

export async function getTeamMemberDetail(journeyId: string) {
  const supabase = await createSupabaseServer()

  const [journeyRes, tasksRes, checkInsRes] = await Promise.all([
    supabase
      .from('journeys')
      .select('*, employee:profiles!employee_id(*), template:journey_templates!template_id(*)')
      .eq('id', journeyId)
      .single(),
    supabase
      .from('journey_tasks')
      .select('*')
      .eq('journey_id', journeyId)
      .order('week')
      .order('assigned_to_role'),
    supabase
      .from('check_ins')
      .select('*')
      .eq('journey_id', journeyId)
      .order('scheduled_date'),
  ])

  return {
    journey: journeyRes.data,
    tasks: tasksRes.data || [],
    checkIns: checkInsRes.data || [],
  }
}
