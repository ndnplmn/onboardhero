import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getRiskIndicators(managerId: string) {
  return tool({
    description:
      'Get risk-related signals for an employee, including task completion rate, overdue tasks, risk score, risk reasons, and sentiment score.',
    inputSchema: z.object({
      employeeId: z
        .string()
        .optional()
        .describe('The employee profile ID'),
      journeyId: z
        .string()
        .optional()
        .describe('The journey ID. Use this if you already know the journey ID.'),
    }),
    execute: async ({ employeeId, journeyId }) => {
      const supabase = createSupabaseAdmin()

      let journeyQuery = supabase
        .from('journeys')
        .select('*, employee:profiles!employee_id(id, full_name)')
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

      // Get tasks to calculate completion rate and find overdue items
      const { data: tasks } = await supabase
        .from('journey_tasks')
        .select('id, title, week, status, assigned_to_role')
        .eq('journey_id', journey.id)

      const allTasks = tasks || []
      const completedTasks = allTasks.filter((t: any) => t.status === 'completed')
      const overdueTasks = allTasks.filter(
        (t: any) => t.status !== 'completed' && t.week < (journey.current_week ?? 1)
      )

      const completionRate = allTasks.length > 0
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 0

      // Determine risk level
      let riskLevel: string
      if (journey.risk_score >= 70) {
        riskLevel = 'high'
      } else if (journey.risk_score >= 40) {
        riskLevel = 'medium'
      } else {
        riskLevel = 'low'
      }

      return {
        employee: {
          id: (journey as any).employee?.id,
          name: (journey as any).employee?.full_name || 'Unknown',
        },
        riskScore: journey.risk_score,
        riskLevel,
        riskReasons: journey.risk_reasons || [],
        sentimentScore: journey.sentiment_score,
        completionRate,
        currentWeek: journey.current_week,
        overdueTasks: overdueTasks.map((t: any) => ({
          title: t.title,
          week: t.week,
          assignedTo: t.assigned_to_role,
        })),
        recommendations:
          riskLevel === 'high'
            ? 'Immediate intervention recommended. Schedule a 1-on-1 meeting as soon as possible.'
            : riskLevel === 'medium'
            ? 'Monitor closely. Consider an informal check-in this week.'
            : 'On track. Continue regular check-in schedule.',
      }
    },
  })
}
