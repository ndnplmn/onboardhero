import { createSupabaseServer } from '@/lib/db/supabase-server'
import AlertsClient from './AlertsClient'

export const dynamic = 'force-dynamic'

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

  const atRisk = atRiskRes.data ?? []
  const overdueCI = (checkInsRes.data ?? []).map((ci: any) => ({
    id: ci.id,
    milestone: ci.milestone,
    scheduled_date: ci.scheduled_date,
    employee_name: ci.journey?.employee?.full_name || 'Unknown',
    department: ci.journey?.employee?.department || '',
    manager_name: ci.journey?.manager?.full_name || 'Unknown',
  }))
  const notifications = notifsRes.data ?? []

  return (
    <AlertsClient
      atRisk={atRisk as any}
      overdueCheckIns={overdueCI as any}
      notifications={notifications as any}
    />
  )
}
