import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import HireAlertsClient from '@/components/platform/HireAlertsClient'

export const dynamic = 'force-dynamic'

// ── Mock fallback ─────────────────────────────────────────────────────────

function buildMockData() {
  const now = new Date()
  const y   = now.getFullYear()
  const m   = now.getMonth()
  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (day: number) => `${y}-${pad(m + 1)}-${pad(Math.min(day, new Date(y, m + 1, 0).getDate()))}`

  const notifications = [
    { id: 'n1', type: 'checkin'  as const, title: 'Check-in Scheduled',     message: 'Your 30-Day Review with Sarah Chen is scheduled for Apr 15 at 10:00 AM.',    created_at: new Date(Date.now() - 1 * 86400000).toISOString(), read: false },
    { id: 'n2', type: 'task'     as const, title: 'Task Due Soon',           message: 'Complete IT security training is due in 2 days.',                             created_at: new Date(Date.now() - 2 * 86400000).toISOString(), read: false },
    { id: 'n3', type: 'milestone'as const, title: 'Milestone Approaching',   message: 'Your 30-Day milestone is coming up. Make sure your goals are reviewed.',      created_at: new Date(Date.now() - 3 * 86400000).toISOString(), read: false },
    { id: 'n4', type: 'info'     as const, title: 'Welcome to OnboardHero!', message: 'Your onboarding journey has started. Check your tasks to get started.',       created_at: new Date(Date.now() - 7 * 86400000).toISOString(), read: true  },
    { id: 'n5', type: 'info'     as const, title: 'Wiki Available',          message: 'The company wiki is now available. Read the required articles at your pace.', created_at: new Date(Date.now() - 8 * 86400000).toISOString(), read: true  },
  ]

  const pendingTasks = [
    { id: 't1', title: 'Complete IT security training', due_date: iso(10), overdue: new Date(iso(10)) < now },
    { id: 't2', title: 'Submit benefits enrollment form', due_date: iso(12), overdue: new Date(iso(12)) < now },
    { id: 't5', title: 'Review engineering handbook', due_date: iso(18), overdue: false },
  ]

  const start = new Date(`${y}-${pad(m + 1)}-01`)
  const ms30  = new Date(start); ms30.setDate(ms30.getDate() + 30)
  const ms60  = new Date(start); ms60.setDate(ms60.getDate() + 60)

  const upcomingEvents = [
    { id: 'ev1', label: '30-Day Review',  date: ms30.toISOString().split('T')[0], color: 'var(--cyan)' },
    { id: 'ev2', label: 'Weekly 1:1',     date: iso(8),  color: 'var(--blue)'  },
    { id: 'ev3', label: '60-Day Review',  date: ms60.toISOString().split('T')[0], color: 'var(--aqua)' },
  ]

  return { notifications, pendingTasks, upcomingEvents }
}

export default async function HireAlertsPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: journey } = await supabase
    .from('journeys')
    .select('id, start_date')
    .eq('employee_id', user.id)
    .in('status', ['active', 'at_risk'])
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const [notifsRes, tasksRes, checkInsRes] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, type, title, message, created_at, read')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    journey ? supabase
      .from('tasks')
      .select('id, title, due_date, completed')
      .eq('employee_id', user.id)
      .eq('completed', false)
      .order('due_date', { ascending: true }) : Promise.resolve({ data: null }),
    journey ? supabase
      .from('check_ins')
      .select('id, scheduled_date, type')
      .eq('journey_id', journey.id)
      .is('completed_date', null)
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .limit(5) : Promise.resolve({ data: null }),
  ])

  const mock = buildMockData()

  const notifications = (notifsRes.data && notifsRes.data.length > 0)
    ? notifsRes.data.map((n: any) => ({ ...n, type: n.type as any }))
    : mock.notifications

  const now = new Date()
  const pendingTasks = (tasksRes.data && tasksRes.data.length > 0)
    ? tasksRes.data.map((t: any) => ({
        id: t.id,
        title: t.title,
        due_date: t.due_date ?? '',
        overdue: t.due_date ? new Date(t.due_date) < now : false,
      }))
    : mock.pendingTasks

  const TYPE_LABELS: Record<string, string> = {
    weekly: 'Weekly 1:1', day30: '30-Day Review', day60: '60-Day Review', day90: '90-Day Sign-off', 'ad-hoc': 'Ad-hoc',
  }
  const TYPE_COLORS: Record<string, string> = {
    weekly: 'var(--blue)', day30: 'var(--cyan)', day60: 'var(--aqua)', day90: 'var(--green)', 'ad-hoc': 'var(--amber)',
  }

  const upcomingEvents = (checkInsRes.data && checkInsRes.data.length > 0)
    ? checkInsRes.data.map((ci: any) => ({
        id:    ci.id,
        label: TYPE_LABELS[ci.type] ?? ci.type,
        date:  ci.scheduled_date,
        color: TYPE_COLORS[ci.type] ?? 'var(--blue)',
      }))
    : mock.upcomingEvents

  return (
    <HireAlertsClient
      notifications={notifications}
      pendingTasks={pendingTasks}
      upcomingEvents={upcomingEvents}
    />
  )
}
