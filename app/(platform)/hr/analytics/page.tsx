import { createSupabaseServer } from '@/lib/db/supabase-server'
import AnalyticsClient from './AnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function HRAnalyticsPage() {
  const supabase = await createSupabaseServer()

  const [journeysRes, tasksRes, checkInsRes, feedbackRes, pulseRes] = await Promise.all([
    supabase
      .from('journeys')
      .select('id, status, current_week, risk_score, risk_reasons, start_date, employee:profiles!employee_id(id, full_name, avatar_url, department), manager:profiles!manager_id(id, full_name)')
      .order('risk_score', { ascending: false }),
    supabase
      .from('journey_tasks')
      .select('journey_id, status, week'),
    supabase
      .from('check_ins')
      .select('id, milestone, scheduled_date, completed_date, journey:journeys!journey_id(employee:profiles!employee_id(full_name, department)), manager:profiles!manager_id(full_name)')
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('feedback_surveys')
      .select('id, milestone, rating, comments, created_at, employee:profiles!employee_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('pulse_checks')
      .select('week, score')
      .order('week'),
  ])

  const journeys   = journeysRes.data  ?? []
  const tasks      = tasksRes.data     ?? []
  const checkIns   = checkInsRes.data  ?? []
  const feedback   = feedbackRes.data  ?? []
  const pulseData  = pulseRes.data     ?? []

  // ── Real Cohort Data (group by start month) ──────────────────────────────
  const cohortMap: Record<string, { journeyIds: string[]; atRisk: number; completed: number; totalDays: number }> = {}
  for (const j of journeys as any[]) {
    if (!j.start_date) continue
    const d = new Date(j.start_date)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    if (!cohortMap[label]) cohortMap[label] = { journeyIds: [], atRisk: 0, completed: 0, totalDays: 0 }
    cohortMap[label].journeyIds.push(j.id)
    if ((j.risk_score ?? 0) > 60) cohortMap[label].atRisk++
    if (j.status === 'completed') cohortMap[label].completed++
    cohortMap[label].totalDays += Math.max(1, Math.round((Date.now() - d.getTime()) / 86400000))
  }
  const cohortData = Object.entries(cohortMap)
    .map(([label, { journeyIds, atRisk, completed, totalDays }]) => {
      const cohortTasks = (tasks as any[]).filter((t: any) => journeyIds.includes(t.journey_id))
      const done = cohortTasks.filter((t: any) => t.status === 'completed').length
      const avgProgress = cohortTasks.length > 0 ? Math.round(done / cohortTasks.length * 100) : 0
      const avgDays = journeyIds.length > 0 ? Math.round(totalDays / journeyIds.length) : 0
      return { label, hired: journeyIds.length, avgProgress, atRisk, completed, avgDays }
    })
    .sort((a, b) => {
      const da = new Date(a.label).getTime(), db = new Date(b.label).getTime()
      return da - db
    })
    .slice(-8)

  // ── Real Dept Data ──────────────────────────────────────────────────────
  const deptMap: Record<string, { journeyIds: string[]; atRisk: number; weeks: number[] }> = {}
  for (const j of journeys as any[]) {
    const dept = j.employee?.department || 'Other'
    if (!deptMap[dept]) deptMap[dept] = { journeyIds: [], atRisk: 0, weeks: [] }
    deptMap[dept].journeyIds.push(j.id)
    if ((j.risk_score ?? 0) > 60) deptMap[dept].atRisk++
    if (j.current_week) deptMap[dept].weeks.push(j.current_week)
  }
  const deptData = Object.entries(deptMap).map(([name, { journeyIds, atRisk, weeks }]) => {
    const deptTasks = (tasks as any[]).filter((t: any) => journeyIds.includes(t.journey_id))
    const done = deptTasks.filter((t: any) => t.status === 'completed').length
    const progress = deptTasks.length > 0 ? Math.round(done / deptTasks.length * 100) : 0
    const avgWeek = weeks.length > 0 ? +(weeks.reduce((a, b) => a + b, 0) / weeks.length).toFixed(1) : 0
    return { name, progress, atRisk, avgWeek }
  })

  // ── Real Manager Effectiveness Data ────────────────────────────────────
  const mgrMap: Record<string, { name: string; total: number; completed: number; atRisk: number }> = {}
  for (const j of journeys as any[]) {
    const mgr = j.manager
    if (!mgr?.id) continue
    if (!mgrMap[mgr.id]) mgrMap[mgr.id] = { name: mgr.full_name ?? 'Unknown', total: 0, completed: 0, atRisk: 0 }
    mgrMap[mgr.id].total++
    if (j.status === 'completed') mgrMap[mgr.id].completed++
    if ((j.risk_score ?? 0) > 60) mgrMap[mgr.id].atRisk++
  }
  const managerData = Object.values(mgrMap)
    .map(({ name, total, completed }) => {
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0
      const trend: 'top' | 'good' | 'support' | 'risk' =
        successRate >= 85 ? 'top' : successRate >= 70 ? 'good' : successRate >= 50 ? 'support' : 'risk'
      return { name, avatar: `https://i.pravatar.cc/40?u=${encodeURIComponent(name)}`, hires: total, successRate, trend }
    })
    .sort((a, b) => b.successRate - a.successRate)

  return (
    <AnalyticsClient
      journeys={journeys as any}
      tasks={tasks as any}
      checkIns={checkIns as any}
      feedback={feedback as any}
      pulseData={pulseData as any}
      cohortData={cohortData}
      deptData={deptData}
      managerData={managerData}
    />
  )
}
