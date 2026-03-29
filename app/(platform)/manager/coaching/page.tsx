import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'
import { redirect } from 'next/navigation'
import CoachingClient from './CoachingClient'

export const dynamic = 'force-dynamic'

export default async function ManagerCoaching() {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify manager role (admin client bypasses RLS)
  const admin = createSupabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager') redirect('/')

  // Fetch team journeys (admin client to avoid RLS issues with joined profiles)
  const { data: journeys } = await admin
    .from('journeys')
    .select('id, status, current_week, risk_score, sentiment_score, start_date, employee:profiles!employee_id(id, full_name, department)')
    .eq('manager_id', user.id)
    .in('status', ['in_progress', 'at_risk', 'not_started'])
    .order('created_at', { ascending: false })

  // Get task counts per journey
  const journeyIds = (journeys || []).map((j: any) => j.id)
  let taskCounts: Record<string, { total: number; completed: number }> = {}

  if (journeyIds.length > 0) {
    const { data: tasks } = await admin
      .from('journey_tasks')
      .select('journey_id, status')
      .in('journey_id', journeyIds)

    for (const t of tasks || []) {
      if (!taskCounts[t.journey_id]) {
        taskCounts[t.journey_id] = { total: 0, completed: 0 }
      }
      taskCounts[t.journey_id].total++
      if (t.status === 'completed') {
        taskCounts[t.journey_id].completed++
      }
    }
  }

  const teamMembers = (journeys || []).map((j: any) => {
    const counts = taskCounts[j.id] || { total: 0, completed: 0 }
    const progress = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0
    return {
      journeyId: j.id,
      employeeId: j.employee?.id || '',
      name: j.employee?.full_name || 'Unknown',
      department: j.employee?.department || 'General',
      status: j.status as string,
      currentWeek: j.current_week as number,
      riskScore: j.risk_score as number,
      sentimentScore: j.sentiment_score as number,
      progress,
      completedTasks: counts.completed,
      totalTasks: counts.total,
    }
  })

  return <CoachingClient teamMembers={teamMembers} />
}
