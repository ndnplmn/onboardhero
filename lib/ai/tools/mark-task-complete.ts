import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function markTaskComplete(journeyId: string) {
  return tool({
    description:
      'Mark an onboarding task as completed. Use this when the employee says they have finished a task.',
    inputSchema: z.object({
      taskId: z.string().describe('The ID of the task to mark as completed'),
    }),
    execute: async ({ taskId }) => {
      const supabase = createSupabaseAdmin()

      // Verify the task belongs to this journey
      const { data: task, error: fetchError } = await supabase
        .from('journey_tasks')
        .select('id, title, status')
        .eq('id', taskId)
        .eq('journey_id', journeyId)
        .single()

      if (fetchError || !task) {
        return { error: 'Task not found or does not belong to your journey.' }
      }

      if (task.status === 'completed') {
        return { message: `Task "${task.title}" is already marked as completed.` }
      }

      const { error: updateError } = await supabase
        .from('journey_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('journey_id', journeyId)

      if (updateError) {
        return { error: `Failed to update task: ${updateError.message}` }
      }

      return { message: `Task "${task.title}" has been marked as completed.` }
    },
  })
}
