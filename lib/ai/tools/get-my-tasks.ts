import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getMyTasks(journeyId: string) {
  return tool({
    description:
      'Get the list of onboarding tasks for the current employee. Optionally filter by week number.',
    inputSchema: z.object({
      weekFilter: z
        .number()
        .optional()
        .describe('Filter tasks by a specific week number'),
    }),
    execute: async ({ weekFilter }) => {
      const supabase = createSupabaseAdmin()

      let query = supabase
        .from('journey_tasks')
        .select('id, title, description, status, week, due_date, completed_at, category')
        .eq('journey_id', journeyId)
        .order('week', { ascending: true })
        .order('due_date', { ascending: true })

      if (weekFilter !== undefined) {
        query = query.eq('week', weekFilter)
      }

      const { data, error } = await query

      if (error) {
        return { error: `Failed to fetch tasks: ${error.message}` }
      }

      return { tasks: data ?? [] }
    },
  })
}
