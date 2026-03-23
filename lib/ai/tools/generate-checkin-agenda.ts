import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function generateCheckinAgenda(managerId: string) {
  return tool({
    description:
      'Gather all relevant data for a check-in meeting with an employee. Returns tasks completed, pending tasks, risk indicators, sentiment, and recent activity so the AI can generate a structured agenda.',
    inputSchema: z.object({
      journeyId: z
        .string()
        .describe('The journey ID to generate a check-in agenda for'),
    }),
    execute: async ({ journeyId }) => {
      const supabase = createSupabaseAdmin()

      // Verify the journey belongs to this manager
      const { data: journey, error: journeyError } = await supabase
        .from('journeys')
        .select('*, employee:profiles!employee_id(id, full_name, department)')
        .eq('id', journeyId)
        .eq('manager_id', managerId)
        .single()

      if (journeyError || !journey) {
        return { error: 'Journey not found or you are not the assigned manager.' }
      }

      // Fetch tasks and check-ins in parallel
      const [tasksRes, checkInsRes] = await Promise.all([
        supabase
          .from('journey_tasks')
          .select('id, title, description, week, status, completed_at, assigned_to_role')
          .eq('journey_id', journeyId)
          .order('week')
          .order('assigned_to_role'),
        supabase
          .from('check_ins')
          .select('id, milestone, scheduled_date, completed_date, ai_agenda, notes')
          .eq('journey_id', journeyId)
          .order('scheduled_date'),
      ])

      const tasks = tasksRes.data || []
      const checkIns = checkInsRes.data || []

      const completedTasks = tasks.filter((t: any) => t.status === 'completed')
      const pendingTasks = tasks.filter((t: any) => t.status !== 'completed')
      const overdueTasks = pendingTasks.filter(
        (t: any) => t.week < (journey.current_week ?? 1)
      )
      const currentWeekTasks = tasks.filter(
        (t: any) => t.week === journey.current_week
      )

      // Find the next upcoming check-in
      const nextCheckIn = checkIns.find((c: any) => !c.completed_date)
      const lastCompletedCheckIn = [...checkIns].reverse().find((c: any) => c.completed_date)

      return {
        employee: {
          name: (journey as any).employee?.full_name || 'Unknown',
          department: (journey as any).employee?.department || 'General',
        },
        journey: {
          id: journey.id,
          status: journey.status,
          currentWeek: journey.current_week,
          riskScore: journey.risk_score,
          riskReasons: journey.risk_reasons,
          sentimentScore: journey.sentiment_score,
        },
        taskOverview: {
          totalTasks: tasks.length,
          completedCount: completedTasks.length,
          pendingCount: pendingTasks.length,
          overdueCount: overdueTasks.length,
          progressPercent: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
        },
        overdueTasks: overdueTasks.map((t: any) => ({ title: t.title, week: t.week })),
        currentWeekTasks: currentWeekTasks.map((t: any) => ({
          title: t.title,
          status: t.status,
          assignedTo: t.assigned_to_role,
        })),
        recentlyCompleted: completedTasks.slice(-5).map((t: any) => ({
          title: t.title,
          completedAt: t.completed_at,
        })),
        nextCheckIn: nextCheckIn
          ? { id: nextCheckIn.id, milestone: nextCheckIn.milestone, scheduledDate: nextCheckIn.scheduled_date }
          : null,
        lastCheckInNotes: lastCompletedCheckIn?.notes || null,
      }
    },
  })
}
