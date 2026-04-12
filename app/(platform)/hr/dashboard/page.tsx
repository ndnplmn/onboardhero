import { getHRDashboardData } from '@/lib/db/queries/dashboard'
import HRDashboardClient from './HRDashboardClient'

export const dynamic = 'force-dynamic'

// ── Mock fallback ──────────────────────────────────────────────────────────

const MOCK_JOURNEYS = [
  { id: 'j1', status: 'active',    current_week: 3,  risk_score: 72, start_date: '2026-03-01', employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' }, manager: { id: 'm1', full_name: 'Sarah Chen' } },
  { id: 'j2', status: 'active',    current_week: 7,  risk_score: 44, start_date: '2026-01-15', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  }, manager: { id: 'm1', full_name: 'Sarah Chen' } },
  { id: 'j3', status: 'completed', current_week: 12, risk_score: 12, start_date: '2025-12-01', employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales',       avatar_url: 'https://i.pravatar.cc/150?u=james'  }, manager: { id: 'm2', full_name: 'David Park' } },
  { id: 'j4', status: 'active',    current_week: 2,  risk_score: 18, start_date: '2026-03-15', employee: { id: 'e4', full_name: 'Diana Torres', department: 'Design',      avatar_url: 'https://i.pravatar.cc/150?u=diana'  }, manager: { id: 'm2', full_name: 'David Park' } },
]

const MOCK_TASKS = [
  ...Array.from({ length: 12 }, (_, i) => [
    { journey_id: 'j1', week: i + 1, status: i < 2  ? 'completed' : 'pending', assigned_to_role: 'new_hire' },
    { journey_id: 'j2', week: i + 1, status: i < 6  ? 'completed' : 'pending', assigned_to_role: i % 2 === 0 ? 'manager' : 'new_hire' },
    { journey_id: 'j3', week: i + 1, status: 'completed', assigned_to_role: 'new_hire' },
  ]).flat(),
]

const MOCK_PROFILES = [
  { id: 'e1', role: 'new_hire', department: 'Product',     active: true },
  { id: 'e2', role: 'new_hire', department: 'Engineering', active: true },
  { id: 'e3', role: 'new_hire', department: 'Sales',       active: true },
  { id: 'e4', role: 'new_hire', department: 'Design',      active: true },
  { id: 'm1', role: 'manager',  department: 'Engineering', active: true },
  { id: 'm2', role: 'manager',  department: 'Sales',       active: true },
  { id: 'h1', role: 'hr',       department: 'People',      active: true },
]

export default async function HRDashboard() {
  const { journeys: dbJourneys, tasks: dbTasks, profiles: dbProfiles } = await getHRDashboardData()

  const journeys = dbJourneys.length > 0 ? dbJourneys : MOCK_JOURNEYS
  const tasks    = dbTasks.length    > 0 ? dbTasks    : MOCK_TASKS
  const profiles = dbProfiles.length > 0 ? dbProfiles : MOCK_PROFILES

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

  return (
    <HRDashboardClient
      journeys={journeys as any}
      kpis={{
        totalWorkforce,
        newHires,
        activeJourneys:   activeJourneys.length,
        completedJourneys: completedJourneys.length,
        atRisk,
        taskCompletionPct,
      }}
      completionData={completionData.length > 0 ? completionData : [
        { label: 'Prod', value: 95 },
        { label: 'Sales', value: 82 },
        { label: 'Eng',  value: 88 },
        { label: 'HR',   value: 100 },
      ]}
      engagementData={engagementData.some(d => d.value > 0) ? engagementData : [
        { label: 'W1', value: 85 },
        { label: 'W2', value: 92 },
        { label: 'W3', value: 89 },
        { label: 'W4', value: 94 },
        { label: 'W5', value: 91 },
      ]}
      stages={stages}
    />
  )
}
