import { getHRDashboardData } from '@/lib/db/queries/dashboard'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import HRDashboardClient from './HRDashboardClient'
import type { DeptNode } from '@/components/platform/GlobalFrictionMap'

export const dynamic = 'force-dynamic'

export default async function HRDashboard() {
  const { journeys, tasks, profiles, managers, templates } = await getHRDashboardData()

  // ── Derive real KPIs ─────────────────────────────────────────────────────
  const totalWorkforce    = profiles.length
  const newHires          = profiles.filter((p: any) => p.role === 'new_hire').length
  const activeJourneys    = journeys.filter((j: any) => j.status !== 'completed')
  const completedJourneys = journeys.filter((j: any) => j.status === 'completed')
  const atRisk            = activeJourneys.filter((j: any) => (j.risk_score ?? 0) > 60).length
  const completedTasks    = tasks.filter((t: any) => t.status === 'completed').length
  const totalTasks        = tasks.length
  const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // ── Completion by dept (from journeys) ───────────────────────────────────
  const deptMap: Record<string, { total: number; completed: number }> = {}
  journeys.forEach((j: any) => {
    const dept = j.employee?.department || 'Other'
    if (!deptMap[dept]) deptMap[dept] = { total: 0, completed: 0 }
    deptMap[dept].total++
    if (j.status === 'completed') deptMap[dept].completed++
  })
  const completionData = Object.entries(deptMap).map(([label, { total, completed }]) => ({
    label: label.length > 4 ? label.slice(0, 3) : label,
    value: total > 0 ? Math.round((completed / total) * 100) : 0,
  }))

  // ── Weekly engagement (completion rate per week) ─────────────────────────
  const engagementData = Array.from({ length: 5 }, (_, i) => {
    const week = i + 1
    const wt   = tasks.filter((t: any) => t.week === week)
    const done = wt.filter((t: any) => t.status === 'completed').length
    return {
      label: `W${week}`,
      value: wt.length > 0 ? Math.round((done / wt.length) * 100) : 0,
    }
  })

  // ── Stage pipeline ───────────────────────────────────────────────────────
  const stages = [
    { label: 'Pre-boarding', count: profiles.filter((p: any) => p.role === 'new_hire' && !activeJourneys.find((j: any) => j.employee?.id === p.id)).length },
    { label: 'First Week',   count: activeJourneys.filter((j: any) => j.current_week <= 1).length },
    { label: 'First Month',  count: activeJourneys.filter((j: any) => j.current_week > 1 && j.current_week <= 4).length },
    { label: 'Ramp-up',      count: activeJourneys.filter((j: any) => j.current_week > 4).length },
  ]

  // ── Employees for EmployeeTable ──────────────────────────────────────────
  const employees = journeys.map((j: any) => {
    const emp      = j.employee ?? {}
    const startMs  = j.start_date ? new Date(j.start_date).getTime() : Date.now()
    const days     = Math.max(0, Math.round((Date.now() - startMs) / 86400000))
    const jTasks   = tasks.filter((t: any) => t.journey_id === j.id)
    const done     = jTasks.filter((t: any) => t.status === 'completed').length
    const progress = jTasks.length > 0 ? Math.round((done / jTasks.length) * 100) : 0
    const status: 'on-track' | 'at-risk' | 'completed' =
      j.status === 'completed' ? 'completed' : (j.risk_score ?? 0) > 60 ? 'at-risk' : 'on-track'
    return {
      id:       j.id,
      name:     emp.full_name ?? 'Unknown',
      role:     emp.role ?? 'New Hire',
      dept:     emp.department ?? '—',
      days,
      progress,
      status,
      avatar:   emp.avatar_url ?? null,
    }
  })

  // ── Alerts from at-risk journeys ─────────────────────────────────────────
  const alerts = activeJourneys
    .filter((j: any) => (j.risk_score ?? 0) > 60)
    .slice(0, 5)
    .map((j: any) => ({
      id:          `alert-${j.id}`,
      type:        'warning' as const,
      title:       `${j.employee?.full_name ?? 'New hire'} needs attention`,
      description: `Week ${j.current_week ?? '?'} · Risk score ${j.risk_score ?? '?'}/100. Consider scheduling a check-in.`,
      action:      { label: 'Schedule Check-In', onClick: 'schedule' },
    }))

  // ── Sentiment & retention risk ────────────────────────────────────────────
  const sentimentScores = journeys
    .map((j: any) => j.sentiment_score)
    .filter((s: any) => typeof s === 'number') as number[]
  const avgSentiment = sentimentScores.length > 0
    ? Math.round(sentimentScores.reduce((a: number, b: number) => a + b, 0) / sentimentScores.length)
    : undefined
  const retentionRisk = activeJourneys.length > 0
    ? Math.round((atRisk / activeJourneys.length) * 100)
    : 0

  // ── KPI deltas (week-over-week task completion) ───────────────────────────
  const maxWeek       = Math.max(...journeys.map((j: any) => j.current_week ?? 0), 1)
  const curWTasks     = tasks.filter((t: any) => t.week === maxWeek)
  const prevWTasks    = tasks.filter((t: any) => t.week === maxWeek - 1)
  const curWPct       = curWTasks.length  > 0 ? Math.round(curWTasks.filter((t: any)  => t.status === 'completed').length  / curWTasks.length  * 100) : 0
  const prevWPct      = prevWTasks.length > 0 ? Math.round(prevWTasks.filter((t: any) => t.status === 'completed').length / prevWTasks.length * 100) : 0
  const taskDelta     = prevWTasks.length > 0 ? curWPct - prevWPct : undefined

  // atRisk delta: compare current vs last 7-day window using start_date
  const now           = Date.now()
  const oneWeekAgo    = now - 7 * 86400000
  const twoWeeksAgo   = now - 14 * 86400000
  const thisWeekRisk  = journeys.filter((j: any) => {
    const ms = j.start_date ? new Date(j.start_date).getTime() : 0
    return ms > oneWeekAgo && (j.risk_score ?? 0) > 60
  }).length
  const lastWeekRisk  = journeys.filter((j: any) => {
    const ms = j.start_date ? new Date(j.start_date).getTime() : 0
    return ms > twoWeeksAgo && ms <= oneWeekAgo && (j.risk_score ?? 0) > 60
  }).length
  const atRiskDelta   = lastWeekRisk > 0 || thisWeekRisk > 0 ? thisWeekRisk - lastWeekRisk : undefined

  // ── Time-to-Productivity (TTP) ───────────────────────────────────────────
  // TTP = estimated days for a hire to reach 80% task completion at current pace.
  // For completed journeys: use actual elapsed days × (0.8 / 1.0).
  // For in-progress: elapsed_days × (0.8 / completionPct).
  const ttpValues: number[] = journeys
    .map((j: any) => {
      const jTasks = tasks.filter((t: any) => t.journey_id === j.id)
      if (!jTasks.length || !j.start_date) return null
      const completedPct = jTasks.filter((t: any) => t.status === 'completed').length / jTasks.length
      if (completedPct <= 0) return null
      const elapsed = Math.max(1, Math.round((Date.now() - new Date(j.start_date).getTime()) / 86400000))
      if (j.status === 'completed') return Math.round(elapsed * 0.8)
      return Math.round(elapsed * 0.8 / completedPct)
    })
    .filter((v): v is number => v !== null && v > 0 && v <= 180) // cap at 180d to remove outliers

  const avgTTP = ttpValues.length > 0
    ? Math.round(ttpValues.reduce((a, b) => a + b, 0) / ttpValues.length)
    : null

  // Benchmark: industry average for structured onboarding is ~45 days
  const TTP_BENCHMARK = 45
  const ttpDelta = avgTTP !== null ? TTP_BENCHMARK - avgTTP : null // positive = faster than benchmark

  // ── Talent Velocity by department ────────────────────────────────────────
  const deptTaskMap: Record<string, { done: number; total: number; riskScores: number[] }> = {}
  journeys.forEach((j: any) => {
    const dept = j.employee?.department || 'Other'
    if (!deptTaskMap[dept]) deptTaskMap[dept] = { done: 0, total: 0, riskScores: [] }
    const jTasks = tasks.filter((t: any) => t.journey_id === j.id)
    deptTaskMap[dept].done  += jTasks.filter((t: any) => t.status === 'completed').length
    deptTaskMap[dept].total += jTasks.length
    deptTaskMap[dept].riskScores.push(j.risk_score ?? 0)
  })
  const deptStats = Object.entries(deptTaskMap).map(([name, { done, total, riskScores }]) => {
    const velocity = total > 0 ? Math.round((done / total) * 100) : 0
    const avgRisk  = riskScores.reduce((a, b) => a + b, 0) / riskScores.length
    const trend: 'up' | 'down' | 'stable' = avgRisk < 30 ? 'up' : avgRisk > 60 ? 'down' : 'stable'
    return { name, velocity, trend, hires: riskScores.length }
  })

  // ── Department friction nodes from real journey risk scores ───────────────
  const deptAccum: Record<string, { riskScores: number[]; startDates: string[]; frictionTypeCounts: Record<string, number> }> = {}
  journeys.forEach((j: any) => {
    const dept = j.employee?.department || 'Other'
    if (!deptAccum[dept]) deptAccum[dept] = { riskScores: [], startDates: [], frictionTypeCounts: {} }
    deptAccum[dept].riskScores.push(j.risk_score ?? 0)
    deptAccum[dept].startDates.push(j.start_date)
    const fps: any[] = Array.isArray(j.friction_points) ? j.friction_points : []
    fps.forEach((fp: any) => {
      if (fp?.type) {
        deptAccum[dept].frictionTypeCounts[fp.type] = (deptAccum[dept].frictionTypeCounts[fp.type] ?? 0) + 1
      }
    })
  })
  const deptNodes: DeptNode[] = Object.entries(deptAccum).map(([name, { riskScores, startDates, frictionTypeCounts }], idx) => {
    const avgRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length
    const friction = avgRisk / 100
    const avgDay = Math.round(
      startDates.reduce((sum, d) => sum + Math.max(0, (Date.now() - new Date(d).getTime()) / 86400000), 0) / startDates.length
    )
    const status: DeptNode['status'] = friction > 0.6 ? 'high-risk' : friction > 0.35 ? 'turbulence' : 'stable'
    const frictionType = Object.entries(frictionTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return {
      id: `dept-${idx}`,
      name,
      friction,
      hires: riskScores.length,
      status,
      day: avgDay,
      frictionType,
      description: status === 'high-risk'
        ? `High friction across ${riskScores.length} hire${riskScores.length > 1 ? 's' : ''}. Avg risk score: ${Math.round(avgRisk)}/100.`
        : status === 'turbulence'
          ? `Friction signals detected. Avg risk score: ${Math.round(avgRisk)}/100.`
          : `Stable onboarding. Avg risk score: ${Math.round(avgRisk)}/100.`,
      intervention: status === 'high-risk'
        ? 'Review at-risk hires immediately and schedule check-ins with their managers.'
        : status === 'turbulence'
          ? 'Monitor closely and consider proactive outreach to hiring managers.'
          : 'No action required. Continue weekly monitoring.',
    }
  })

  // ── HR Inbox — prioritized actions needed today ──────────────────────────
  interface InboxItem {
    id:         string
    priority:   'high' | 'medium' | 'info'
    icon:       string
    title:      string
    desc:       string
    href?:      string
    hireName?:  string
    riskScore?: number
    week?:      number
    journeyId?: string
  }
  const inboxItems: InboxItem[] = []

  // High: at-risk hires without a recent check-in
  activeJourneys.filter((j: any) => (j.risk_score ?? 0) > 60).slice(0, 3).forEach((j: any) => {
    inboxItems.push({
      id:        `risk-${j.id}`,
      priority:  'high',
      icon:      'fa-solid fa-triangle-exclamation',
      title:     `${j.employee?.full_name ?? 'Unknown'} is at risk`,
      desc:      `Risk ${j.risk_score}/100 · Week ${j.current_week ?? '?'} · Schedule a check-in now`,
      href:      `/hr/journeys`,
      hireName:  j.employee?.full_name ?? 'Unknown',
      riskScore: j.risk_score ?? 0,
      week:      j.current_week ?? undefined,
      journeyId: j.id,
    })
  })

  // Medium: hires with unresolved friction points
  activeJourneys.filter((j: any) => {
    const fps: any[] = Array.isArray(j.friction_points) ? j.friction_points : []
    return fps.some((fp: any) => fp.status !== 'resolved')
  }).slice(0, 2).forEach((j: any) => {
    const fps: any[] = Array.isArray(j.friction_points) ? j.friction_points : []
    const unresolvedCount = fps.filter((fp: any) => fp.status !== 'resolved').length
    inboxItems.push({
      id:        `friction-${j.id}`,
      priority:  'medium',
      icon:      'fa-solid fa-route',
      title:     `${j.employee?.full_name ?? 'Unknown'} has unresolved blockers`,
      desc:      `${unresolvedCount} friction point${unresolvedCount > 1 ? 's' : ''} need attention`,
      href:      `/manager/dashboard`,
      hireName:  j.employee?.full_name ?? 'Unknown',
      riskScore: j.risk_score ?? 0,
      journeyId: j.id,
    })
  })

  // Medium: hires approaching 30/60/90 day milestones (±3 days)
  activeJourneys.filter((j: any) => {
    if (!j.start_date) return false
    const days = Math.round((Date.now() - new Date(j.start_date).getTime()) / 86400000)
    return [28, 29, 30, 31, 58, 59, 60, 61, 88, 89, 90, 91].includes(days)
  }).slice(0, 2).forEach((j: any) => {
    const days = Math.round((Date.now() - new Date(j.start_date).getTime()) / 86400000)
    const milestone = days < 35 ? '30-Day' : days < 65 ? '60-Day' : '90-Day'
    inboxItems.push({
      id:        `milestone-${j.id}`,
      priority:  'medium',
      icon:      'fa-solid fa-calendar-star',
      title:     `${j.employee?.full_name ?? 'Unknown'}: ${milestone} milestone`,
      desc:      `Day ${days} — review goal progress and update status`,
      href:      `/hr/journeys`,
      hireName:  j.employee?.full_name ?? 'Unknown',
      journeyId: j.id,
    })
  })

  // Info: hires who started this week (need orientation support)
  activeJourneys.filter((j: any) => {
    if (!j.start_date) return false
    const days = Math.round((Date.now() - new Date(j.start_date).getTime()) / 86400000)
    return days >= 0 && days <= 3
  }).slice(0, 2).forEach((j: any) => {
    inboxItems.push({
      id:        `newstart-${j.id}`,
      priority:  'info',
      icon:      'fa-solid fa-door-open',
      title:     `${j.employee?.full_name ?? 'Unknown'} just started`,
      desc:      `Day ${Math.round((Date.now() - new Date(j.start_date).getTime()) / 86400000)} — confirm VPN, email, and tool access`,
      href:      `/hr/journeys`,
      hireName:  j.employee?.full_name ?? 'Unknown',
      journeyId: j.id,
    })
  })

  // ── Intervention wins — HR actions that correlated with risk drops ────────
  const twoWeeksAgoISO = new Date(Date.now() - 14 * 86400000).toISOString()
  const admin = createSupabaseAdmin()
  const { data: priorActions } = await admin
    .from('action_log')
    .select('journey_id, metadata, created_at')
    .eq('action_type', 'hr_intervention_acted')
    .eq('actor_role', 'hr')
    .lt('created_at', twoWeeksAgoISO)

  interface InterventionWin { hireName: string; before: number; after: number; daysAgo: number }
  const interventionWins: InterventionWin[] = []

  if (priorActions?.length) {
    const journeyRiskMap = new Map<string, number>(
      journeys.map((j: any) => [j.id, j.risk_score ?? 0])
    )
    for (const action of priorActions) {
      const before = (action.metadata as any)?.riskScoreAtIntervention as number | undefined
      const after  = journeyRiskMap.get(action.journey_id)
      const name   = (action.metadata as any)?.hireName as string | undefined
      if (before != null && after != null && name && after < before - 10) {
        const daysAgo = Math.round((Date.now() - new Date(action.created_at).getTime()) / 86400000)
        interventionWins.push({ hireName: name, before, after, daysAgo })
      }
    }
  }

  return (
    <HRDashboardClient
      journeys={journeys as any}
      managers={managers as any}
      templates={templates as any}
      inboxItems={inboxItems}
      interventionWins={interventionWins}
      kpis={{
        totalWorkforce,
        newHires,
        activeJourneys:    activeJourneys.length,
        completedJourneys: completedJourneys.length,
        atRisk,
        taskCompletionPct,
        taskDelta,
        atRiskDelta,
      }}
      completionData={completionData}
      engagementData={engagementData}
      stages={stages}
      deptNodes={deptNodes}
      employees={employees}
      alerts={alerts}
      avgSentiment={avgSentiment}
      retentionRisk={retentionRisk}
      deptStats={deptStats}
      avgTTP={avgTTP}
      ttpDelta={ttpDelta}
    />
  )
}
