import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import CalendarClient from '@/app/(platform)/manager/calendar/CalendarClient'

export const dynamic = 'force-dynamic'

// ── Mock fallback — org-wide check-ins ────────────────────────────────────

function buildMockCheckIns() {
  const now = new Date()
  const y   = now.getFullYear()
  const m   = now.getMonth()
  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (day: number) => `${y}-${pad(m + 1)}-${pad(Math.min(day, new Date(y, m + 1, 0).getDate()))}`

  return [
    { id: 'ci1', scheduled_date: iso(5),  completed_date: null,        type: 'weekly',   notes: null, employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' } },
    { id: 'ci2', scheduled_date: iso(10), completed_date: iso(10),     type: 'day30',    notes: null, employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  } },
    { id: 'ci3', scheduled_date: iso(14), completed_date: null,        type: 'weekly',   notes: null, employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales',       avatar_url: 'https://i.pravatar.cc/150?u=james'  } },
    { id: 'ci4', scheduled_date: iso(18), completed_date: null,        type: 'day60',    notes: null, employee: { id: 'e4', full_name: 'Diana Torres', department: 'Design',      avatar_url: 'https://i.pravatar.cc/150?u=diana'  } },
    { id: 'ci5', scheduled_date: iso(22), completed_date: null,        type: 'day90',    notes: null, employee: { id: 'e5', full_name: 'Liam Evans',   department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=liam'   } },
    { id: 'ci6', scheduled_date: iso(26), completed_date: null,        type: 'ad-hoc',   notes: null, employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales',       avatar_url: 'https://i.pravatar.cc/150?u=james'  } },
  ]
}

const MOCK_JOURNEYS = [
  { id: 'j1', current_week: 3,  start_date: '2026-03-01', employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' } },
  { id: 'j2', current_week: 7,  start_date: '2026-01-15', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  } },
  { id: 'j3', current_week: 2,  start_date: '2026-03-15', employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales',       avatar_url: 'https://i.pravatar.cc/150?u=james'  } },
  { id: 'j4', current_week: 10, start_date: '2025-12-01', employee: { id: 'e5', full_name: 'Liam Evans',   department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=liam'   } },
]

export default async function HRCalendarPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Org-wide check-ins (no manager filter)
  const { data: dbCheckIns } = await supabase
    .from('check_ins')
    .select('id, scheduled_date, completed_date, type, notes, employee:profiles!employee_id(id, full_name, department, avatar_url)')
    .order('scheduled_date', { ascending: true })

  const { data: dbJourneys } = await supabase
    .from('journeys')
    .select('id, current_week, start_date, employee:profiles!employee_id(id, full_name, department, avatar_url)')
    .in('status', ['active', 'at_risk'])

  const checkIns = (dbCheckIns && dbCheckIns.length > 0) ? dbCheckIns : buildMockCheckIns()
  const journeys = (dbJourneys && dbJourneys.length > 0) ? dbJourneys : MOCK_JOURNEYS

  // Derive upcoming deadlines
  const today = new Date()
  const deadlines = journeys.flatMap((j: any) => {
    const start = new Date(j.start_date)
    return [
      { days: 30,  label: '30-Day Review',   employee: j.employee },
      { days: 60,  label: '60-Day Review',   employee: j.employee },
      { days: 90,  label: '90-Day Sign-off', employee: j.employee },
    ]
      .map(m => {
        const date = new Date(start)
        date.setDate(date.getDate() + m.days)
        return { ...m, date, dateStr: date.toISOString().split('T')[0] }
      })
      .filter(m => m.date >= today)
  })
    .sort((a: any, b: any) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime())
    .slice(0, 6)

  const hirees = journeys.map((j: any) => ({
    id:   j.id,
    name: j.employee?.full_name  ?? 'Unknown',
    role: j.employee?.department ?? 'New Hire',
  }))

  return (
    <CalendarClient
      checkIns={checkIns as any}
      deadlines={deadlines as any}
      hirees={hirees}
    />
  )
}
