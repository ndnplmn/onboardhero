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

  const admin = createSupabaseAdmin()

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

  const dbTeamMembers = (journeys || []).map((j: any) => {
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

  const MOCK_TEAM_MEMBERS = [
    { journeyId: 'j1', employeeId: 'e1', name: 'Marcus Reed',  department: 'Product',     status: 'in_progress', currentWeek: 3,  riskScore: 18, sentimentScore: 82, progress: 24, completedTasks: 3,  totalTasks: 12 },
    { journeyId: 'j2', employeeId: 'e2', name: 'Priya Mehta',  department: 'Engineering', status: 'at_risk',     currentWeek: 7,  riskScore: 74, sentimentScore: 38, progress: 58, completedTasks: 7,  totalTasks: 12 },
    { journeyId: 'j4', employeeId: 'e4', name: 'Diana Torres', department: 'Design',      status: 'in_progress', currentWeek: 2,  riskScore: 12, sentimentScore: 91, progress: 16, completedTasks: 2,  totalTasks: 12 },
  ]

  const teamMembers = dbTeamMembers.length > 0 ? dbTeamMembers : MOCK_TEAM_MEMBERS

  return <CoachingClient teamMembers={teamMembers} />
}
