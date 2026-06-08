import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import CohortClient from './CohortClient'

export const dynamic = 'force-dynamic'

export default async function CohortPage() {
  const admin = createSupabaseAdmin()

  // Fetch current month's journeys
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: journeys } = await admin
    .from('journeys')
    .select(`
      id, status, current_week, risk_score, sentiment_score, start_date, created_at,
      employee:profiles!journeys_employee_id_fkey(id, full_name, department, avatar_url, email),
      manager:profiles!journeys_manager_id_fkey(id, full_name)
    `)
    .gte('created_at', monthStart.toISOString())
    .order('created_at', { ascending: false })

  // Fetch ALL-time journeys for retention funnel (not just this month)
  const { data: allJourneys } = await admin
    .from('journeys')
    .select('id, status, current_week, risk_score, start_date, employee:profiles!journeys_employee_id_fkey(department)')

  const journeyIds = (journeys ?? []).map((j: any) => j.id)

  // Check-ins
  let checkInMap: Record<string, number> = {}
  // Milestone completion per journey (for retention funnel)
  let milestoneMap: Record<string, Set<string>> = {}

  if (journeyIds.length > 0) {
    const { data: checkIns } = await admin
      .from('check_ins')
      .select('journey_id, type, completed_date')
      .in('journey_id', (allJourneys ?? []).map((j: any) => j.id))

    for (const ci of checkIns ?? []) {
      if (!checkInMap[ci.journey_id] && journeyIds.includes(ci.journey_id)) {
        checkInMap[ci.journey_id] = 0
      }
      if (journeyIds.includes(ci.journey_id) && !ci.completed_date) {
        checkInMap[ci.journey_id] = (checkInMap[ci.journey_id] ?? 0) + 1
      }
      if (ci.completed_date) {
        if (!milestoneMap[ci.journey_id]) milestoneMap[ci.journey_id] = new Set()
        milestoneMap[ci.journey_id].add(ci.type)
      }
    }
  }

  // Task completion
  let taskMap: Record<string, { total: number; done: number }> = {}
  if (journeyIds.length > 0) {
    const { data: tasks } = await admin
      .from('journey_tasks')
      .select('journey_id, status')
      .in('journey_id', journeyIds)

    for (const t of tasks ?? []) {
      if (!taskMap[t.journey_id]) taskMap[t.journey_id] = { total: 0, done: 0 }
      taskMap[t.journey_id].total++
      if (t.status === 'completed') taskMap[t.journey_id].done++
    }
  }

  const rows = (journeys ?? []).map((j: any) => {
    const emp = Array.isArray(j.employee) ? j.employee[0] : j.employee
    const mgr = Array.isArray(j.manager)  ? j.manager[0]  : j.manager
    const tm  = taskMap[j.id] ?? { total: 0, done: 0 }
    return {
      id:              j.id,
      name:            emp?.full_name  ?? 'Unknown',
      dept:            emp?.department ?? '—',
      avatarUrl:       emp?.avatar_url ?? null,
      managerName:     mgr?.full_name  ?? '—',
      week:            j.current_week  ?? 0,
      riskScore:       j.risk_score    ?? 0,
      sentiment:       j.sentiment_score ?? null,
      status:          j.status        ?? 'active',
      taskProgress:    tm.total > 0 ? Math.round((tm.done / tm.total) * 100) : 0,
      pendingCheckIns: checkInMap[j.id] ?? 0,
      startDate:       j.start_date    ?? '',
    }
  })

  // ── Retention funnel from all-time journeys ─────────────────────────────
  const total = (allJourneys ?? []).length
  const reached30  = (allJourneys ?? []).filter((j: any) =>
    j.current_week >= 4 || j.status === 'completed' ||
    milestoneMap[j.id]?.has('day30') || milestoneMap[j.id]?.has('day_30')
  ).length
  const reached60  = (allJourneys ?? []).filter((j: any) =>
    j.current_week >= 8 || j.status === 'completed' ||
    milestoneMap[j.id]?.has('day60') || milestoneMap[j.id]?.has('day_60')
  ).length
  const reached90  = (allJourneys ?? []).filter((j: any) =>
    j.status === 'completed' ||
    milestoneMap[j.id]?.has('day90') || milestoneMap[j.id]?.has('day_90')
  ).length

  const retentionFunnel = {
    total,
    day30: { count: reached30,  pct: total > 0 ? Math.round((reached30  / total) * 100) : 0 },
    day60: { count: reached60,  pct: total > 0 ? Math.round((reached60  / total) * 100) : 0 },
    day90: { count: reached90,  pct: total > 0 ? Math.round((reached90  / total) * 100) : 0 },
  }

  // ── Department breakdown ────────────────────────────────────────────────
  const deptMap: Record<string, { total: number; atRisk: number; avgRisk: number }> = {}
  for (const j of allJourneys ?? []) {
    const emp  = Array.isArray(j.employee) ? j.employee[0] : j.employee
    const dept = emp?.department ?? 'Unknown'
    if (!deptMap[dept]) deptMap[dept] = { total: 0, atRisk: 0, avgRisk: 0 }
    deptMap[dept].total++
    deptMap[dept].avgRisk += j.risk_score ?? 0
    if ((j.risk_score ?? 0) > 60) deptMap[dept].atRisk++
  }
  const deptBreakdown = Object.entries(deptMap)
    .map(([dept, d]) => ({
      dept,
      total:   d.total,
      atRisk:  d.atRisk,
      avgRisk: d.total > 0 ? Math.round(d.avgRisk / d.total) : 0,
    }))
    .sort((a, b) => b.atRisk - a.atRisk)

  // ── Last-month comparison for KPI deltas ──────────────────────────────────
  const prevMonthStart = new Date(monthStart)
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1)
  const prevMonthEnd = new Date(monthStart)
  prevMonthEnd.setMilliseconds(-1)

  const { data: prevJourneys } = await admin
    .from('journeys')
    .select('id, risk_score, status')
    .gte('created_at', prevMonthStart.toISOString())
    .lte('created_at', prevMonthEnd.toISOString())

  const prevTotal   = (prevJourneys ?? []).length
  const prevAtRisk  = (prevJourneys ?? []).filter((j: any) => (j.risk_score ?? 0) >= 70).length
  const prevOnTrack = (prevJourneys ?? []).filter((j: any) => (j.risk_score ?? 0) < 40).length

  const lastMonthDeltas = prevTotal > 0
    ? {
        total:   (journeys ?? []).length - prevTotal,
        atRisk:  rows.filter(r => r.riskScore >= 70).length - prevAtRisk,
        onTrack: rows.filter(r => r.riskScore < 40).length - prevOnTrack,
      }
    : null

  return <CohortClient rows={rows} retentionFunnel={retentionFunnel} deptBreakdown={deptBreakdown} lastMonthDeltas={lastMonthDeltas} />
}
