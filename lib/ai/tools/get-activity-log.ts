import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getActivityLog() {
  return tool({
    description:
      'Get recent activity for a journey including last task completion timestamps and login frequency proxy based on last activity.',
    inputSchema: z.object({
      journeyId: z.string().describe('The journey ID to get activity for'),
    }),
    execute: async ({ journeyId }) => {
      const supabase = createSupabaseAdmin()

      // Get recently completed tasks as activity signals
      const { data: recentTasks, error: tasksError } = await supabase
        .from('journey_tasks')
        .select('id, title, status, completed_at, week')
        .eq('journey_id', journeyId)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10)

      if (tasksError) {
        return { error: `Failed to fetch activity: ${tasksError.message}` }
      }

      // Get recent check-ins
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('id, milestone, completed_date, scheduled_date')
        .eq('journey_id', journeyId)
        .order('scheduled_date', { ascending: false })
        .limit(5)

      // Get recent AI conversations as engagement proxy
      const { data: conversations } = await supabase
        .from('ai_conversations')
        .select('id, created_at')
        .eq('journey_id', journeyId)
        .order('created_at', { ascending: false })
        .limit(5)

      const completedTasks = recentTasks || []
      const lastActivity = completedTasks[0]?.completed_at || null
      const conversationDates = (conversations || []).map((c: any) => c.created_at)

      // Calculate days since last activity
      let daysSinceLastActivity: number | null = null
      if (lastActivity) {
        const diff = Date.now() - new Date(lastActivity).getTime()
        daysSinceLastActivity = Math.floor(diff / (1000 * 60 * 60 * 24))
      }

      // Calculate activity level
      let activityLevel: string
      if (daysSinceLastActivity === null) {
        activityLevel = 'inactive'
      } else if (daysSinceLastActivity <= 2) {
        activityLevel = 'active'
      } else if (daysSinceLastActivity <= 7) {
        activityLevel = 'moderate'
      } else {
        activityLevel = 'low'
      }

      // Check-in completion
      const completedCheckIns = (checkIns || []).filter((c: any) => c.completed_date)
      const missedCheckIns = (checkIns || []).filter(
        (c: any) =>
          !c.completed_date && new Date(c.scheduled_date) < new Date()
      )

      return {
        journeyId,
        lastActivity,
        daysSinceLastActivity,
        activityLevel,
        recentCompletions: completedTasks.map((t: any) => ({
          title: t.title,
          completedAt: t.completed_at,
          week: t.week,
        })),
        checkInStatus: {
          completed: completedCheckIns.length,
          missed: missedCheckIns.length,
          total: (checkIns || []).length,
        },
        platformEngagement: {
          recentConversations: conversationDates.length,
          lastConversation: conversationDates[0] || null,
        },
      }
    },
  })
}
