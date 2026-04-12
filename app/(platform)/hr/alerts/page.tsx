import { createSupabaseServer } from '@/lib/db/supabase-server'
import AlertsClient from './AlertsClient'

export const dynamic = 'force-dynamic'

// ── Mock fallback data ─────────────────────────────────────────────────────

const MOCK_AT_RISK = [
  { id: 'j1', risk_score: 82, risk_reasons: ['Missed 30-day survey', 'Low social engagement', '2 overdue tasks'], current_week: 5,  start_date: '2025-12-01', status: 'active', employee: { id: 'e1', full_name: 'Liam Evans',   department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=liam'   }, manager: { id: 'm1', full_name: 'Sarah Chen' } },
  { id: 'j2', risk_score: 67, risk_reasons: ['Hardware setup delay', 'Missed Week 1 sync with team'], current_week: 2,  start_date: '2026-03-01', status: 'active', employee: { id: 'e2', full_name: 'Marcus Reed',  department: 'Design',      avatar_url: 'https://i.pravatar.cc/150?u=marcus' }, manager: { id: 'm1', full_name: 'Sarah Chen' } },
  { id: 'j3', risk_score: 54, risk_reasons: ['Low sentiment score in Week 4 feedback'], current_week: 4,  start_date: '2026-01-15', status: 'active', employee: { id: 'e3', full_name: 'Sarah Kim',   department: 'People',      avatar_url: 'https://i.pravatar.cc/150?u=sarahk' }, manager: { id: 'm2', full_name: 'David Park' } },
]

const MOCK_OVERDUE_CHECKINS = [
  { id: 'c1', milestone: 'day_30', scheduled_date: '2026-03-14', employee_name: 'Priya Mehta',  department: 'Engineering', manager_name: 'Sarah Chen' },
  { id: 'c2', milestone: 'day_60', scheduled_date: '2026-02-28', employee_name: 'Liam Evans',   department: 'Product',     manager_name: 'Sarah Chen' },
]

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'milestone', title: 'Journey Completed',    message: 'James Wilson has completed their onboarding journey!',          created_at: new Date(Date.now() - 2 * 86400000).toISOString(), read: false },
  { id: 'n2', type: 'task',      title: 'Task Overdue',         message: '4 tasks are overdue across 3 active journeys.',                  created_at: new Date(Date.now() - 1 * 86400000).toISOString(), read: false },
  { id: 'n3', type: 'info',      title: 'New Hire Starting',    message: 'Jordan Blake (Product) starts Monday. Journey not yet assigned.', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), read: true  },
  { id: 'n4', type: 'risk',      title: 'Risk Score Increased', message: 'Liam Evans risk score increased to 82 after missed check-in.',   created_at: new Date(Date.now() - 4 * 86400000).toISOString(), read: true  },
]

export default async function HRAlertsPage() {
  const supabase = await createSupabaseServer()

  const [atRiskRes, checkInsRes, notifsRes] = await Promise.all([
    supabase
      .from('journeys')
      .select('id, risk_score, risk_reasons, current_week, start_date, status, employee:profiles!employee_id(id, full_name, avatar_url, department), manager:profiles!manager_id(id, full_name)')
      .gt('risk_score', 40)
      .in('status', ['active', 'at_risk'])
      .order('risk_score', { ascending: false }),
    supabase
      .from('check_ins')
      .select('id, milestone, scheduled_date, journey:journeys!journey_id(employee:profiles!employee_id(full_name, department), manager:profiles!manager_id(full_name))')
      .is('completed_date', null)
      .lt('scheduled_date', new Date().toISOString()),
    supabase
      .from('notifications')
      .select('id, type, title, message, created_at, read')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const atRisk    = (atRiskRes.data    && atRiskRes.data.length    > 0) ? atRiskRes.data    : MOCK_AT_RISK
  const overdueCI = (checkInsRes.data  && checkInsRes.data.length  > 0)
    ? checkInsRes.data.map((ci: any) => ({
        id: ci.id,
        milestone: ci.milestone,
        scheduled_date: ci.scheduled_date,
        employee_name: ci.journey?.employee?.full_name || 'Unknown',
        department: ci.journey?.employee?.department || '',
        manager_name: ci.journey?.manager?.full_name || 'Unknown',
      }))
    : MOCK_OVERDUE_CHECKINS
  const notifications = (notifsRes.data && notifsRes.data.length > 0) ? notifsRes.data : MOCK_NOTIFICATIONS

  return (
    <AlertsClient
      atRisk={atRisk as any}
      overdueCheckIns={overdueCI as any}
      notifications={notifications as any}
    />
  )
}
