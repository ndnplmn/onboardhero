import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getTaskCompletionRates() {
  return tool({
    description:
      'Get task completion rate, velocity, and overdue count for a specific journey. Returns completion percentage, tasks per week vs expected, and overdue task details.',
    inputSchema: z.object({
      journeyId: z.string().describe('The journey ID to analyze'),
    }),
    execute: async ({ journeyId }) => {
      const supabase = createSupabaseAdmin()

      const { data: journey, error: journeyError } = await supabase
        .from('journeys')
        .select('id, current_week, start_date')
        .eq('id', journeyId)
        .single()

      if (journeyError || !journey) {
        return { error: 'Journey not found.' }
      }

      const { data: tasks, error: tasksError } = await supabase
        .from('journey_tasks')
        .select('id, title, week, status, completed_at, due_date')
        .eq('journey_id', journeyId)
        .order('week', { ascending: true })

      if (tasksError) {
        return { error: `Failed to fetch tasks: ${tasksError.message}` }
      }

      const allTasks = tasks || []
      const completed = allTasks.filter((t: any) => t.status === 'completed')
      const currentWeek = journey.current_week ?? 1

      // Tasks that should have been done by now (week <= current_week) but aren't
      const overdue = allTasks.filter(
        (t: any) => t.status !== 'completed' && t.week < currentWeek
      )

      // Tasks expected to be done by current week
      const expectedByNow = allTasks.filter((t: any) => t.week <= currentWeek)
      const expectedCompletionRate =
        expectedByNow.length > 0
          ? Math.round((completed.filter((t: any) => t.week <= currentWeek).length / expectedByNow.length) * 100)
          : 100

      // Overall completion rate
      const overallCompletionRate =
        allTasks.length > 0
          ? Math.round((completed.length / allTasks.length) * 100)
          : 0

      // Velocity: completed tasks per week elapsed
      const weeksElapsed = Math.max(currentWeek, 1)
      const actualVelocity = +(completed.length / weeksElapsed).toFixed(1)
      const expectedVelocity = +(allTasks.length / 12).toFixed(1) // 12-week journey

      return {
        journeyId,
        currentWeek,
        totalTasks: allTasks.length,
        completedTasks: completed.length,
        overallCompletionRate,
        expectedCompletionRate,
        actualVelocity,
        expectedVelocity,
        velocityGap: +(actualVelocity - expectedVelocity).toFixed(1),
        overdueCount: overdue.length,
        overdueTasks: overdue.map((t: any) => ({
          title: t.title,
          week: t.week,
        })),
      }
    },
  })
}
