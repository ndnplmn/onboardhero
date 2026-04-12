import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import { getManagerHiresData } from '@/lib/db/queries/manager'
import HiresClient from './HiresClient'

export const dynamic = 'force-dynamic'

// ── Mock fallback ──────────────────────────────────────────────────────────

const MOCK_JOURNEYS = [
  { id: 'j1', status: 'active',    current_week: 3,  risk_score: 72, start_date: '2026-03-01', employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' } },
  { id: 'j2', status: 'active',    current_week: 7,  risk_score: 44, start_date: '2026-01-15', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  } },
  { id: 'j3', status: 'completed', current_week: 12, risk_score: 12, start_date: '2025-12-01', employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales',       avatar_url: 'https://i.pravatar.cc/150?u=james'  } },
  { id: 'j4', status: 'active',    current_week: 2,  risk_score: 18, start_date: '2026-03-15', employee: { id: 'e4', full_name: 'Diana Torres', department: 'Design',      avatar_url: 'https://i.pravatar.cc/150?u=diana'  } },
]

const MOCK_TASKS = [
  ...Array.from({ length: 12 }, (_, i) => [
    { journey_id: 'j1', status: i < 2  ? 'completed' : 'pending' },
    { journey_id: 'j2', status: i < 6  ? 'completed' : 'pending' },
    { journey_id: 'j3', status: 'completed' },
    { journey_id: 'j4', status: i < 1  ? 'completed' : 'pending' },
  ]).flat(),
]

export default async function ManagerHiresPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { journeys: dbJourneys, tasks: dbTasks, pendingCheckIns } =
    await getManagerHiresData(user.id)

  const journeys = dbJourneys.length > 0 ? dbJourneys : MOCK_JOURNEYS
  const tasks    = dbTasks.length    > 0 ? dbTasks    : MOCK_TASKS

  // ── Derive task completion per journey ──────────────────────────────────
  const taskMap: Record<string, { done: number; total: number }> = {}
  tasks.forEach((t: any) => {
    if (!taskMap[t.journey_id]) taskMap[t.journey_id] = { done: 0, total: 0 }
    taskMap[t.journey_id].total++
    if (t.status === 'completed') taskMap[t.journey_id].done++
  })

  const enrichedJourneys = journeys.map((j: any) => {
    const tc  = taskMap[j.id]
    const pct = tc && tc.total > 0 ? Math.round((tc.done / tc.total) * 100) : 0
    return { ...j, taskPct: pct }
  })

  // ── KPIs ────────────────────────────────────────────────────────────────
  const activeJourneys  = enrichedJourneys.filter((j: any) => j.status !== 'completed')
  const atRisk          = activeJourneys.filter((j: any) => (j.risk_score ?? 0) > 60).length
  const completedCount  = enrichedJourneys.filter((j: any) => j.status === 'completed').length
  const avgTaskCompletion = enrichedJourneys.length > 0
    ? Math.round(enrichedJourneys.reduce((sum: number, j: any) => sum + j.taskPct, 0) / enrichedJourneys.length)
    : 0

  // ── Hirees list for schedule modal ──────────────────────────────────────
  const hirees = activeJourneys.map((j: any) => ({
    id:   j.id,
    name: j.employee?.full_name ?? 'Unknown',
    role: j.employee?.department ?? 'New Hire',
  }))

  return (
    <HiresClient
      journeys={enrichedJourneys as any}
      kpis={{
        totalHires:         enrichedJourneys.length,
        activeCount:        activeJourneys.length,
        atRisk,
        completedCount,
        avgTaskCompletion,
        pendingCheckIns:    pendingCheckIns.length,
      }}
      hirees={hirees}
    />
  )
}
