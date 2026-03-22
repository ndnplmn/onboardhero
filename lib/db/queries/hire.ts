import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function getHireDashboardData(userId: string) {
  const supabase = await createSupabaseServer()

  const { data: journey } = await supabase
    .from('journeys')
    .select('*, manager:profiles!manager_id(*), template:journey_templates!template_id(*)')
    .eq('employee_id', userId)
    .in('status', ['in_progress', 'at_risk', 'not_started'])
    .single()

  if (!journey) return { journey: null, tasks: [], checkIns: [], resources: [] }

  const [tasksRes, checkInsRes, resourcesRes] = await Promise.all([
    supabase
      .from('journey_tasks')
      .select('*')
      .eq('journey_id', journey.id)
      .order('week')
      .order('assigned_to_role'),
    supabase
      .from('check_ins')
      .select('*')
      .eq('journey_id', journey.id)
      .order('scheduled_date'),
    supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  return {
    journey,
    tasks: tasksRes.data || [],
    checkIns: checkInsRes.data || [],
    resources: resourcesRes.data || [],
  }
}
