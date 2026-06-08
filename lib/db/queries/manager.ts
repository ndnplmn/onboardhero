import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function getManagerDashboardData(managerId: string) {
  const supabase = await createSupabaseServer()

  const [journeysRes, checkInsRes, feedbackRes, allCheckInsRes] = await Promise.all([
    supabase
      .from('journeys')
      .select('id, status, current_week, risk_score, sentiment_score, start_date, risk_reasons, friction_points, employee:profiles!employee_id(id, full_name, department, avatar_url), template:journey_templates!template_id(duration_days)')
      .eq('manager_id', managerId)
      .in('status', ['in_progress', 'at_risk', 'not_started', 'active'])
      .order('created_at', { ascending: false }),
    supabase
      .from('check_ins')
      .select('id, journey_id, scheduled_date, journey:journeys!journey_id(employee:profiles!employee_id(full_name, avatar_url))')
      .eq('manager_id', managerId)
      .is('completed_date', null)
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .limit(8),
    supabase
      .from('feedback_surveys')
      .select('rating')
      .eq('manager_id', managerId),
    // All check-ins (completed + pending) for effectiveness computation
    supabase
      .from('check_ins')
      .select('id, scheduled_date, completed_date')
      .eq('manager_id', managerId),
  ])

  const normalizedJourneys = (journeysRes.data || []).map((j: any) => ({
    ...j,
    employee: Array.isArray(j.employee) ? j.employee[0] : j.employee,
  }))

  const journeyIds = normalizedJourneys.map(j => j.id)

  let managerTasks: any[] = []
  let hireGoals:    any[] = []
  if (journeyIds.length > 0) {
    const [tasksRes, goalsRes] = await Promise.all([
      supabase
        .from('journey_tasks')
        .select('id, title, description, week, status, assigned_to_role')
        .in('journey_id', journeyIds)
        .eq('assigned_to_role', 'manager')
        .in('status', ['pending', 'in_progress'])
        .order('week', { ascending: true })
        .limit(5),
      supabase
        .from('journey_goals')
        .select('id, journey_id, milestone, title, description, status, created_at')
        .in('journey_id', journeyIds)
        .order('created_at', { ascending: false }),
    ])
    managerTasks = tasksRes.data || []
    hireGoals    = goalsRes.data  || []
  }

  // Normalize check-ins: extract employee name + avatarUrl from nested join
  const normalizedCheckIns = (checkInsRes.data || []).map((ci: any) => {
    const journey = Array.isArray(ci.journey) ? ci.journey[0] : ci.journey
    const employee = Array.isArray(journey?.employee) ? journey?.employee[0] : journey?.employee
    return {
      id: ci.id,
      date: ci.scheduled_date,
      employee: employee?.full_name ?? 'Unknown',
      avatarUrl: employee?.avatar_url ?? null,
    }
  })

  const feedbackRows = feedbackRes.data || []
  const avgFeedbackRating = feedbackRows.length
    ? Math.round(feedbackRows.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / feedbackRows.length * 10) / 10
    : null

  // ── Manager Effectiveness Score ──────────────────────────────────────────
  // checkInCompletionRate: % of all scheduled check-ins that were completed
  const allCheckIns        = allCheckInsRes.data || []
  const totalScheduled     = allCheckIns.length
  const completedCheckIns  = allCheckIns.filter((c: any) => c.completed_date).length
  const checkInCompletionRate = totalScheduled > 0
    ? Math.round((completedCheckIns / totalScheduled) * 100)
    : null

  // atRiskResponseRate: % of at-risk journeys that have at least 1 completed check-in
  const atRiskJourneys     = normalizedJourneys.filter((j: any) => (j.risk_score ?? 0) > 60)
  const atRiskJourneyIds   = new Set(atRiskJourneys.map((j: any) => j.id))
  const respondedToAtRisk  = allCheckIns.filter((c: any) => atRiskJourneyIds.has(c.journey_id) && c.completed_date).length
  const atRiskResponseRate = atRiskJourneys.length > 0
    ? Math.round((Math.min(respondedToAtRisk, atRiskJourneys.length) / atRiskJourneys.length) * 100)
    : null

  // engagementScore: inverse of avg risk score (higher = healthier team)
  const activeJourneys = normalizedJourneys.filter((j: any) => j.status !== 'completed')
  const teamHealthScore = activeJourneys.length > 0
    ? Math.round(100 - (activeJourneys.reduce((s: number, j: any) => s + (j.risk_score ?? 0), 0) / activeJourneys.length))
    : null

  return {
    journeys:            normalizedJourneys,
    upcomingCheckIns:    normalizedCheckIns,
    managerTasks,
    avgFeedbackRating,
    hireGoals,
    effectiveness: {
      checkInCompletionRate,
      atRiskResponseRate,
      teamHealthScore,
      totalCheckIns:    totalScheduled,
      completedCheckIns,
    },
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

  const normalizedJourneys = (journeysRes.data || []).map((j: any) => ({
    ...j,
    employee: Array.isArray(j.employee) ? j.employee[0] : j.employee
  }))

  return {
    journeys:         normalizedJourneys,
    tasks:            tasksRes.data     || [],
    pendingCheckIns:  checkInsRes.data  || [],
  }
}

export async function getManagerTasksData(managerId: string) {
  const supabase = await createSupabaseServer()

  // First get all journey IDs for this manager
  const { data: journeys } = await supabase
    .from('journeys')
    .select('id, employee:profiles!employee_id(id, full_name, department, avatar_url)')
    .eq('manager_id', managerId)
    .order('created_at', { ascending: false })

  const journeyIds = (journeys || []).map((j: any) => j.id)

  if (journeyIds.length === 0) {
    return { tasks: [], journeys: [] }
  }

  const { data: tasks } = await supabase
    .from('journey_tasks')
    .select('id, title, description, week, status, assigned_to_role, due_date, completed_at, journey_id')
    .in('journey_id', journeyIds)
    .eq('assigned_to_role', 'manager')
    .order('week', { ascending: true })

  const normalizedJourneys = (journeys || []).map((j: any) => ({
    ...j,
    employee: Array.isArray(j.employee) ? j.employee[0] : j.employee,
  }))

  return {
    tasks:    tasks    || [],
    journeys: normalizedJourneys,
  }
}

export async function getManagerCalendarData(managerId: string) {
  const supabase = await createSupabaseServer()

  // Current month window
  const now       = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [checkInsRes, journeysRes] = await Promise.all([
    supabase
      .from('check_ins')
      .select('id, scheduled_date, completed_date, type, notes, journey:journeys!journey_id(id, employee:profiles!employee_id(id, full_name, department, avatar_url))')
      .eq('manager_id', managerId)
      .gte('scheduled_date', monthStart)
      .lte('scheduled_date', monthEnd)
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('journeys')
      .select('id, current_week, start_date, employee:profiles!employee_id(id, full_name, department, avatar_url)')
      .eq('manager_id', managerId)
      .neq('status', 'completed'),
  ])

  const normalizedCheckIns = (checkInsRes.data || []).map((c: any) => {
    const journey = Array.isArray(c.journey) ? c.journey[0] : c.journey
    const emp     = Array.isArray(journey?.employee) ? journey?.employee[0] : journey?.employee
    return { ...c, journey: undefined, employee: emp }
  })

  const normalizedJourneys = (journeysRes.data || []).map((j: any) => ({
    ...j,
    employee: Array.isArray(j.employee) ? j.employee[0] : j.employee,
  }))

  return {
    checkIns: normalizedCheckIns,
    journeys: normalizedJourneys,
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

  const journeyData = journeyRes.data as any
  if (journeyData) {
    if (Array.isArray(journeyData.employee)) journeyData.employee = journeyData.employee[0]
    if (Array.isArray(journeyData.template)) journeyData.template = journeyData.template[0]
  }

  return {
    journey:  journeyData,
    tasks:    tasksRes.data   || [],
    checkIns: checkInsRes.data || [],
  }
}
