import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import { getManagerHiresData } from '@/lib/db/queries/manager'
import HiresClient from './HiresClient'

export const dynamic = 'force-dynamic'

export default async function ManagerHiresPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { journeys: dbJourneys, tasks: dbTasks, pendingCheckIns } =
    await getManagerHiresData(user.id)

  // ── Derive task completion per journey ──────────────────────────────────
  const taskMap: Record<string, { done: number; total: number }> = {}
  dbTasks.forEach((t: any) => {
    if (!taskMap[t.journey_id]) taskMap[t.journey_id] = { done: 0, total: 0 }
    taskMap[t.journey_id].total++
    if (t.status === 'completed') taskMap[t.journey_id].done++
  })

  const enrichedJourneys = dbJourneys.map((j: any) => {
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
