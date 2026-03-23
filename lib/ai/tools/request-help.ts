import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function requestHelp(userId: string, journeyId: string) {
  return tool({
    description:
      'Send a help request or nudge to the manager. Use this when the employee needs assistance that the AI cannot provide.',
    inputSchema: z.object({
      message: z
        .string()
        .describe('The help request message to send to the manager'),
    }),
    execute: async ({ message }) => {
      const supabase = createSupabaseAdmin()

      // Get the manager_id from the journey
      const { data: journey, error: journeyError } = await supabase
        .from('journeys')
        .select('manager_id')
        .eq('id', journeyId)
        .single()

      if (journeyError || !journey) {
        return { error: 'Could not find your journey to send the help request.' }
      }

      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: journey.manager_id,
          type: 'nudge',
          title: 'Help Request from New Hire',
          message,
          metadata: {
            from_user_id: userId,
            journey_id: journeyId,
          },
        })

      if (insertError) {
        return { error: `Failed to send help request: ${insertError.message}` }
      }

      return {
        message:
          'Your help request has been sent to your manager. They will be notified and should follow up with you soon.',
      }
    },
  })
}
