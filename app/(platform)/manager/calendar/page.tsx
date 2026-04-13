import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import { getManagerCalendarData } from '@/lib/db/queries/manager'
import CalendarClient from './CalendarClient'

export const dynamic = 'force-dynamic'

// ── Mock fallback — uses real current date so calendar is always accurate ──

function buildMockCheckIns() {
  const now    = new Date()
  const y      = now.getFullYear()
  const m      = now.getMonth()

  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (day: number) => `${y}-${pad(m + 1)}-${pad(day)}`

  // Spread across days that exist this month
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const d1 = Math.min(5,  daysInMonth)
  const d2 = Math.min(12, daysInMonth)
  const d3 = Math.min(18, daysInMonth)
  const d4 = Math.min(24, daysInMonth)

  return [
    { id: 'ci1', scheduled_date: iso(d1), completed_date: null, type: 'weekly',  notes: null, employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' } },
    { id: 'ci2', scheduled_date: iso(d2), completed_date: null, type: 'day30',   notes: null, employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  } },
    { id: 'ci3', scheduled_date: iso(d3), completed_date: null, type: 'weekly',  notes: null, employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales',       avatar_url: 'https://i.pravatar.cc/150?u=james'  } },
    { id: 'ci4', scheduled_date: iso(d4), completed_date: null, type: 'day60',   notes: null, employee: { id: 'e4', full_name: 'Diana Torres', department: 'Design',      avatar_url: 'https://i.pravatar.cc/150?u=diana'  } },
  ]
}

const MOCK_JOURNEYS = [
  { id: 'j1', current_week: 3,  start_date: '2026-03-01', employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' } },
  { id: 'j2', current_week: 7,  start_date: '2026-01-15', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  } },
  { id: 'j3', current_week: 2,  start_date: '2026-03-15', employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales',       avatar_url: 'https://i.pravatar.cc/150?u=james'  } },
]

export default async function ManagerCalendarPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { checkIns: dbCheckIns, journeys: dbJourneys } = await getManagerCalendarData(user.id)

  const checkIns = dbCheckIns.length > 0 ? dbCheckIns : buildMockCheckIns()
  const journeys = dbJourneys.length > 0 ? dbJourneys : MOCK_JOURNEYS

  // ── Derive upcoming deadlines from journeys (30/60/90-day milestones) ────
  const today = new Date()
  const deadlines = journeys.flatMap((j: any) => {
    const start = new Date(j.start_date)
    const milestones = [
      { days: 30,  label: '30-Day Review',  employee: j.employee },
      { days: 60,  label: '60-Day Review',  employee: j.employee },
      { days: 90,  label: '90-Day Sign-off', employee: j.employee },
    ]
    return milestones
      .map(m => {
        const date = new Date(start)
        date.setDate(date.getDate() + m.days)
        return { ...m, date, dateStr: date.toISOString().split('T')[0] }
      })
      .filter(m => m.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  })
  .sort((a: any, b: any) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime())
  .slice(0, 5)

  // Hirees list for schedule modal
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
