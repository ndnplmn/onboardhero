import { createSupabaseServer } from '@/lib/db/supabase-server'
import EmployeesClient from './employees-client'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const supabase = await createSupabaseServer()

  const [profilesRes, managersRes, templatesRes, journeysRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, role, department, avatar_url, active, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'manager')
      .eq('active', true),
    supabase
      .from('journey_templates')
      .select('id, name'),
    supabase
      .from('journeys')
      .select('employee_id, status, current_week, start_date')
      .in('status', ['active', 'at_risk', 'completed', 'paused']),
  ])

  return (
    <EmployeesClient
      profiles={profilesRes.data || []}
      managers={managersRes.data || []}
      templates={templatesRes.data || []}
      journeys={journeysRes.data || []}
    />
  )
}
