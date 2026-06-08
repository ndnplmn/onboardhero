import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function getHireDashboardData(userId: string) {
  const supabase = await createSupabaseServer()

  const { data: journey } = await supabase
    .from('journeys')
    .select('id, status, current_week, risk_score, risk_reasons, friction_points, start_date, employee:profiles!employee_id(id, full_name, avatar_url), manager:profiles!manager_id(id, full_name, email, avatar_url), template:journey_templates!template_id(id, name, preboarding_tasks)')
    .eq('employee_id', userId)
    .in('status', ['in_progress', 'at_risk', 'not_started', 'active', 'completed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!journey) return { journey: null, tasks: [], checkIns: [], resources: [] }

  const [tasksRes, checkInsRes, resourcesRes, pulseRes] = await Promise.all([
    supabase
      .from('journey_tasks')
      .select('id, title, description, week, status, assigned_to_role, due_date, completed_at')
      .eq('journey_id', journey.id)
      .eq('assigned_to_role', 'new_hire')
      .order('week')
      .order('assigned_to_role'),
    supabase
      .from('check_ins')
      .select('id, type, scheduled_date, completed_date, notes, manager_notes')
      .eq('journey_id', journey.id)
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('resources')
      .select('id, title, description, type, url, icon')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('pulse_checks')
      .select('score, week, radar_snapshot')
      .eq('journey_id', journey.id)
      .order('week', { ascending: false })
      .limit(8),
  ])

  // Normalize nested joins
  const journeyData = journey as any
  if (Array.isArray(journeyData.employee)) journeyData.employee = journeyData.employee[0]
  if (Array.isArray(journeyData.manager))  journeyData.manager  = journeyData.manager[0]
  if (Array.isArray(journeyData.template)) journeyData.template = journeyData.template[0]

  return {
    journey:      journeyData,
    tasks:        tasksRes.data    || [],
    checkIns:     checkInsRes.data || [],
    resources:    resourcesRes.data || [],
    pulseChecks:  pulseRes.data    || [],
  }
}
