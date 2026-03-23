import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getEmployeeDetail(managerId: string) {
  return tool({
    description:
      'Get detailed onboarding progress for a specific employee, including their journey status, all tasks, and check-in history.',
    inputSchema: z.object({
      employeeId: z
        .string()
        .optional()
        .describe('The employee profile ID to look up'),
      journeyId: z
        .string()
        .optional()
        .describe('The journey ID to look up. Use this if you already know the journey ID.'),
    }),
    execute: async ({ employeeId, journeyId }) => {
      const supabase = createSupabaseAdmin()

      // Build journey query
      let journeyQuery = supabase
        .from('journeys')
        .select('*, employee:profiles!employee_id(id, full_name, email, department)')
        .eq('manager_id', managerId)

      if (journeyId) {
        journeyQuery = journeyQuery.eq('id', journeyId)
      } else if (employeeId) {
        journeyQuery = journeyQuery.eq('employee_id', employeeId)
      } else {
        return { error: 'Please provide either an employeeId or journeyId.' }
      }

      const { data: journey, error: journeyError } = await journeyQuery.single()

      if (journeyError || !journey) {
        return { error: 'Journey not found for this employee.' }
      }

      // Fetch tasks and check-ins in parallel
      const [tasksRes, checkInsRes] = await Promise.all([
        supabase
          .from('journey_tasks')
          .select('id, title, description, week, status, completed_at, assigned_to_role')
          .eq('journey_id', journey.id)
          .order('week')
          .order('assigned_to_role'),
        supabase
          .from('check_ins')
          .select('id, milestone, scheduled_date, completed_date, ai_agenda, notes')
          .eq('journey_id', journey.id)
          .order('scheduled_date'),
      ])

      const tasks = tasksRes.data || []
      const checkIns = checkInsRes.data || []

      const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
      const overdueTasks = tasks.filter(
        (t: any) => t.status !== 'completed' && t.week < (journey.current_week ?? 1)
      ).length

      return {
        employee: {
          id: (journey as any).employee?.id,
          name: (journey as any).employee?.full_name || 'Unknown',
          department: (journey as any).employee?.department || 'General',
        },
        journey: {
          id: journey.id,
          status: journey.status,
          currentWeek: journey.current_week,
          startDate: journey.start_date,
          riskScore: journey.risk_score,
          riskReasons: journey.risk_reasons,
          sentimentScore: journey.sentiment_score,
        },
        taskSummary: {
          total: tasks.length,
          completed: completedTasks,
          overdue: overdueTasks,
          progressPercent: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
        },
        tasks,
        checkIns,
      }
    },
  })
}
