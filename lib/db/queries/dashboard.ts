import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function getHRDashboardData() {
  const supabase = createSupabaseAdmin()

  const [journeysRes, tasksRes, notifsRes] = await Promise.all([
    supabase
      .from('journeys')
      .select('*, employee:profiles!employee_id(*), manager:profiles!manager_id(*)')
      .order('created_at', { ascending: false }),
    supabase.from('journey_tasks').select('status'),
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return {
    journeys: journeysRes.data || [],
    tasks: tasksRes.data || [],
    notifications: notifsRes.data || [],
  }
}
