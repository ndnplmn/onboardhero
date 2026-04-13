import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import { getManagerTasksData } from '@/lib/db/queries/manager'
import TasksClient from './TasksClient'

export const dynamic = 'force-dynamic'

// ── Mock fallback ──────────────────────────────────────────────────────────

const MOCK_JOURNEYS = [
  { id: 'j1', employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' } },
  { id: 'j2', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  } },
  { id: 'j3', employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales',       avatar_url: 'https://i.pravatar.cc/150?u=james'  } },
]

const MOCK_TASKS = [
  { id: 'mt1', journey_id: 'j1', title: 'Schedule Week 1 Check-in',   description: 'Meet with Marcus for his initial integration review.',   week: 1,  status: 'pending',   assigned_to_role: 'manager', due_date: null, completed_at: null },
  { id: 'mt2', journey_id: 'j2', title: 'Review 30-Day Feedback',     description: 'Analyze the 30-day survey results for Priya.',           week: 4,  status: 'completed', assigned_to_role: 'manager', due_date: null, completed_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'mt3', journey_id: 'j2', title: 'Assign Buddy for Priya',     description: 'Ensure Priya has a social buddy for the technical phase.',week: 2,  status: 'pending',   assigned_to_role: 'manager', due_date: null, completed_at: null },
  { id: 'mt4', journey_id: 'j1', title: 'IT Setup Final Approval',    description: 'Verify all hardware and software access for Marcus.',     week: 1,  status: 'completed', assigned_to_role: 'manager', due_date: null, completed_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'mt5', journey_id: 'j3', title: 'Conduct 90-Day Review',      description: 'Final onboarding review for James Wilson (Day 90).',     week: 12, status: 'pending',   assigned_to_role: 'manager', due_date: null, completed_at: null },
  { id: 'mt6', journey_id: 'j2', title: 'Complete Culture Workshop',  description: 'Confirm Priya attended the company culture workshop.',    week: 3,  status: 'pending',   assigned_to_role: 'manager', due_date: null, completed_at: null },
]

export default async function ManagerTasksPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { tasks: dbTasks, journeys: dbJourneys } = await getManagerTasksData(user.id)

  const tasks    = dbTasks.length    > 0 ? dbTasks    : MOCK_TASKS
  const journeys = dbJourneys.length > 0 ? dbJourneys : MOCK_JOURNEYS

  // ── Build journey lookup ─────────────────────────────────────────────────
  const journeyMap: Record<string, { id: string; full_name: string; department: string; avatar_url: string | null }> = {}
  journeys.forEach((j: any) => {
    journeyMap[j.id] = j.employee
  })

  // ── Enrich tasks with employee info ─────────────────────────────────────
  const enriched = tasks.map((t: any) => ({
    ...t,
    employee: journeyMap[t.journey_id] ?? null,
  }))

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const total     = enriched.length
  const completed = enriched.filter((t: any) => t.status === 'completed').length
  const pending   = enriched.filter((t: any) => t.status !== 'completed').length
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  // Per-employee breakdown for analytics
  const byEmployee: Record<string, { name: string; done: number; total: number }> = {}
  enriched.forEach((t: any) => {
    const name = t.employee?.full_name ?? 'Unknown'
    if (!byEmployee[name]) byEmployee[name] = { name, done: 0, total: 0 }
    byEmployee[name].total++
    if (t.status === 'completed') byEmployee[name].done++
  })
  const breakdown = Object.values(byEmployee).map(e => ({
    name: e.name,
    pct:  e.total > 0 ? Math.round((e.done / e.total) * 100) : 0,
    done:  e.done,
    total: e.total,
  }))

  return (
    <TasksClient
      tasks={enriched as any}
      kpis={{ total, completed, pending, pct }}
      breakdown={breakdown}
    />
  )
}
