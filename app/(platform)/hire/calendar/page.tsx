import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import HireCalendarClient from '@/components/platform/HireCalendarClient'

export const dynamic = 'force-dynamic'

// ── Mock fallback ─────────────────────────────────────────────────────────

function buildMockData() {
  const now      = new Date()
  const y        = now.getFullYear()
  const m        = now.getMonth()
  const pad      = (n: number) => String(n).padStart(2, '0')
  const iso      = (day: number) => `${y}-${pad(m + 1)}-${pad(Math.min(day, new Date(y, m + 1, 0).getDate()))}`
  const startDate = `${y}-${pad(m)}-01`

  const start = new Date(startDate || `${y}-${pad(m + 1)}-01`)
  const ms30  = new Date(start); ms30.setDate(ms30.getDate() + 30)
  const ms60  = new Date(start); ms60.setDate(ms60.getDate() + 60)
  const ms90  = new Date(start); ms90.setDate(ms90.getDate() + 90)

  const milestones = [
    { label: '30-Day Review',   dateStr: ms30.toISOString().split('T')[0], days: 30, done: ms30 < now },
    { label: '60-Day Review',   dateStr: ms60.toISOString().split('T')[0], days: 60, done: ms60 < now },
    { label: '90-Day Sign-off', dateStr: ms90.toISOString().split('T')[0], days: 90, done: ms90 < now },
  ]

  const checkIns = [
    { id: 'ci1', scheduled_date: iso(8),  completed_date: null, type: 'weekly',  managerName: 'Sarah Chen' },
    { id: 'ci2', scheduled_date: iso(15), completed_date: null, type: 'day30',   managerName: 'Sarah Chen' },
    { id: 'ci3', scheduled_date: iso(22), completed_date: null, type: 'weekly',  managerName: 'Sarah Chen' },
  ]

  const tasks = [
    { id: 't1', title: 'Complete IT security training', due_date: iso(10), done: false },
    { id: 't2', title: 'Submit benefits enrollment form', due_date: iso(12), done: false },
    { id: 't3', title: 'Meet with direct team members', due_date: iso(7),  done: true  },
    { id: 't4', title: 'Set up development environment', due_date: iso(5),  done: true  },
    { id: 't5', title: 'Review engineering handbook',    due_date: iso(18), done: false },
  ]

  return { milestones, checkIns, tasks, startDate: `${y}-${pad(m + 1)}-01` }
}

export default async function HireCalendarPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the user's active journey
  const { data: journey } = await supabase
    .from('journeys')
    .select('id, start_date, manager:profiles!manager_id(full_name)')
    .eq('employee_id', user.id)
    .in('status', ['active', 'at_risk'])
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch personal check-ins
  const { data: dbCheckIns } = journey ? await supabase
    .from('check_ins')
    .select('id, scheduled_date, completed_date, type')
    .eq('journey_id', journey.id)
    .order('scheduled_date', { ascending: true }) : { data: null }

  // Fetch personal tasks
  const { data: dbTasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, completed')
    .eq('employee_id', user.id)
    .order('due_date', { ascending: true })

  const mock = buildMockData()

  // Build milestones from journey start date
  let milestones = mock.milestones
  if (journey?.start_date) {
    const now   = new Date()
    const start = new Date(journey.start_date)
    milestones = [30, 60, 90].map(days => {
      const d = new Date(start)
      d.setDate(d.getDate() + days)
      return {
        label:   `${days}-Day ${days === 90 ? 'Sign-off' : 'Review'}`,
        dateStr: d.toISOString().split('T')[0],
        days,
        done:    d < now,
      }
    })
  }

  const managerName = (journey as any)?.manager?.full_name ?? 'Your Manager'

  const checkIns = (dbCheckIns && dbCheckIns.length > 0)
    ? dbCheckIns.map((ci: any) => ({ ...ci, managerName }))
    : mock.checkIns

  const tasks = (dbTasks && dbTasks.length > 0)
    ? dbTasks.map((t: any) => ({ id: t.id, title: t.title, due_date: t.due_date ?? '', done: t.completed }))
    : mock.tasks

  return (
    <HireCalendarClient
      milestones={milestones}
      checkIns={checkIns}
      tasks={tasks}
      startDate={journey?.start_date ?? mock.startDate}
    />
  )
}
