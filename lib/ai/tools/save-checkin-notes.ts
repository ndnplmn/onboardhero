import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function saveCheckinNotes(managerId: string) {
  return tool({
    description:
      'Save notes and optionally an AI-generated summary to a check-in record. Use this after a manager has reviewed or completed a check-in.',
    inputSchema: z.object({
      checkinId: z
        .string()
        .describe('The check-in record ID to update'),
      notes: z
        .string()
        .describe('The notes to save for this check-in'),
      aiSummary: z
        .string()
        .optional()
        .describe('An AI-generated summary of the check-in discussion'),
      markComplete: z
        .boolean()
        .optional()
        .describe('Whether to mark the check-in as completed'),
    }),
    execute: async ({ checkinId, notes, aiSummary, markComplete }) => {
      const supabase = createSupabaseAdmin()

      // Verify the check-in belongs to this manager
      const { data: checkIn, error: fetchError } = await supabase
        .from('check_ins')
        .select('id, milestone, manager_id')
        .eq('id', checkinId)
        .eq('manager_id', managerId)
        .single()

      if (fetchError || !checkIn) {
        return { error: 'Check-in not found or you are not the assigned manager.' }
      }

      const updateData: Record<string, unknown> = { notes }
      if (aiSummary) {
        updateData.ai_summary = aiSummary
      }
      if (markComplete) {
        updateData.completed_date = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('check_ins')
        .update(updateData)
        .eq('id', checkinId)

      if (updateError) {
        return { error: `Failed to save check-in notes: ${updateError.message}` }
      }

      return {
        message: `Notes saved for ${checkIn.milestone} check-in.${markComplete ? ' Check-in marked as completed.' : ''}`,
      }
    },
  })
}
