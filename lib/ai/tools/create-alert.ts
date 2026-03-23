import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function createAlert() {
  return tool({
    description:
      'Create a notification alert for a user (e.g., HR or manager) about an at-risk employee. Use this for high-risk employees (score > 70).',
    inputSchema: z.object({
      userId: z.string().describe('The user ID to notify (manager or HR)'),
      type: z
        .enum(['risk_alert', 'nudge', 'info'])
        .describe('The notification type'),
      title: z.string().describe('Short alert title'),
      message: z.string().describe('Detailed alert message with context'),
      actionUrl: z
        .string()
        .optional()
        .describe('Optional URL to navigate the user to'),
    }),
    execute: async ({ userId, type, title, message, actionUrl }) => {
      const supabase = createSupabaseAdmin()

      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl || null,
      })

      if (error) {
        return { error: `Failed to create alert: ${error.message}` }
      }

      return {
        message: `Alert created for user ${userId}: "${title}"`,
      }
    },
  })
}
