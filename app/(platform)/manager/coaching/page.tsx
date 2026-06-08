import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'
import { redirect } from 'next/navigation'
import CoachingClient from './CoachingClient'

export const dynamic = 'force-dynamic'

export default async function ManagerCoaching() {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createSupabaseAdmin()

  // Fetch team journeys (admin client to avoid RLS issues with joined profiles)
  const { data: journeys } = await admin
    .from('journeys')
    .select('id, status, current_week, risk_score, sentiment_score, start_date, friction_points, employee:profiles!employee_id(id, full_name, department)')
    .eq('manager_id', user.id)
    .in('status', ['in_progress', 'at_risk', 'not_started'])
    .order('created_at', { ascending: false })

  // Get task counts per journey
  const journeyIds = (journeys || []).map((j: any) => j.id)
  let taskCounts: Record<string, { total: number; completed: number }> = {}

  if (journeyIds.length > 0) {
    const { data: tasks } = await admin
      .from('journey_tasks')
      .select('journey_id, status')
      .in('journey_id', journeyIds)

    for (const t of tasks || []) {
      if (!taskCounts[t.journey_id]) {
        taskCounts[t.journey_id] = { total: 0, completed: 0 }
      }
      taskCounts[t.journey_id].total++
      if (t.status === 'completed') {
        taskCounts[t.journey_id].completed++
      }
    }
  }

  // Last pulse score + history per journey
  const lastPulses: Record<string, number> = {}
  const pulseHistory: Record<string, { week: number; score: number }[]> = {}
  if (journeyIds.length > 0) {
    const { data: pulses } = await admin
      .from('pulse_checks')
      .select('journey_id, score, week, created_at')
      .in('journey_id', journeyIds)
      .order('created_at', { ascending: false })
    for (const p of pulses ?? []) {
      if (!(p.journey_id in lastPulses)) lastPulses[p.journey_id] = p.score
      if (!pulseHistory[p.journey_id]) pulseHistory[p.journey_id] = []
      pulseHistory[p.journey_id].push({ week: p.week, score: p.score })
    }
    // sort each history ascending by week
    for (const id of Object.keys(pulseHistory)) {
      pulseHistory[id] = pulseHistory[id].sort((a, b) => a.week - b.week).slice(-8)
    }
  }

  // Friction points per journey (first 2 labels)
  const frictionByJourney: Record<string, string[]> = {}
  for (const j of journeys ?? []) {
    const fps: any[] = Array.isArray(j.friction_points) ? j.friction_points : []
    frictionByJourney[j.id] = fps.slice(0, 2).map((fp: any) => fp.label ?? fp.type ?? String(fp))
  }

  const dbTeamMembers = (journeys || []).map((j: any) => {
    const counts = taskCounts[j.id] || { total: 0, completed: 0 }
    const progress = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0
    return {
      journeyId:      j.id,
      employeeId:     j.employee?.id || '',
      name:           j.employee?.full_name || 'Unknown',
      department:     j.employee?.department || 'General',
      status:         j.status as string,
      currentWeek:    j.current_week as number,
      riskScore:      j.risk_score as number,
      sentimentScore: j.sentiment_score as number,
      progress,
      completedTasks: counts.completed,
      totalTasks:     counts.total,
      lastPulse:      lastPulses[j.id] ?? null,
      frictionPoints: frictionByJourney[j.id] ?? [],
      pulseHistory:   pulseHistory[j.id] ?? [],
    }
  })

  // Fetch coaching notes saved by this manager
  const { data: coachingNotes } = await admin
    .from('coaching_notes')
    .select('id, content, source, created_at')
    .eq('manager_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return <CoachingClient teamMembers={dbTeamMembers} coachingNotes={coachingNotes ?? []} />
}
