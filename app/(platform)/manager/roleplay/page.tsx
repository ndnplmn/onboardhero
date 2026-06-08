import { getUser } from '@/lib/auth/get-user'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import RoleplayClient from './RoleplayClient'

export const dynamic = 'force-dynamic'

export default async function RoleplayPage() {
  const user = await getUser()
  const supabase = await createSupabaseServer()

  const { data: journeys } = await supabase
    .from('journeys')
    .select('id, current_week, risk_score, status, employee:profiles!employee_id(full_name, role, department)')
    .eq('manager_id', user.id)
    .in('status', ['active', 'in_progress', 'at_risk'])
    .order('risk_score', { ascending: false })
    .limit(10)

  const hires = (journeys || []).map((j: any) => {
    const emp = Array.isArray(j.employee) ? j.employee[0] : j.employee
    return {
      name:       emp?.full_name ?? 'Team Member',
      role:       emp?.role ?? emp?.department ?? 'New Hire',
      riskScore:  j.risk_score ?? 30,
      week:       j.current_week ?? 1,
    }
  }).filter(h => h.name !== 'Team Member')

  return <RoleplayClient user={user} hires={hires} />
}
