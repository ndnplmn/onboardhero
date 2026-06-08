import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'
import EmployeesClient from './employees-client'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const supabase = await createSupabaseServer()
  const admin = createSupabaseAdmin()

  const [profilesRes, managersRes, templatesRes, journeysRes, roleplayRes] = await Promise.all([
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
      .select('employee_id, status, current_week, start_date, template:journey_templates!template_id(duration_days)')
      .in('status', ['active', 'at_risk', 'completed', 'paused']),
    admin
      .from('action_log')
      .select('actor_id')
      .eq('action_type', 'roleplay_completed'),
  ])

  // Count roleplay completions per manager
  const roleplayCounts: Record<string, number> = {}
  for (const row of roleplayRes.data ?? []) {
    roleplayCounts[row.actor_id] = (roleplayCounts[row.actor_id] ?? 0) + 1
  }

  return (
    <EmployeesClient
      profiles={profilesRes.data || []}
      managers={managersRes.data || []}
      templates={templatesRes.data || []}
      journeys={journeysRes.data || []}
      roleplayCounts={roleplayCounts}
    />
  )
}
