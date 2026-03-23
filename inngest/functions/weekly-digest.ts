import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { sendNotificationEmail } from '@/lib/email/resend'

export const weeklyDigest = inngest.createFunction(
  { id: 'weekly-digest', name: 'Weekly Digest', triggers: [{ cron: '0 8 * * 1' }] },
  async ({ step }) => {
    const supabase = createSupabaseAdmin()

    const stats = await step.run('calculate-weekly-stats', async () => {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const oneWeekAgoISO = oneWeekAgo.toISOString()

      // New journeys started this week
      const { count: newJourneys } = await supabase
        .from('journeys')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgoISO)

      // Check-ins completed this week (milestones reached)
      const { count: milestonesReached } = await supabase
        .from('check_ins')
        .select('id', { count: 'exact', head: true })
        .gte('completed_date', oneWeekAgo.toISOString().split('T')[0])

      // Current at-risk count
      const { count: atRiskCount } = await supabase
        .from('journeys')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'at_risk')

      // Average completion rate across active journeys
      const { data: activeJourneys } = await supabase
        .from('journeys')
        .select('id')
        .in('status', ['in_progress', 'at_risk'])

      let avgCompletionRate = 0

      if (activeJourneys && activeJourneys.length > 0) {
        const journeyIds = activeJourneys.map((j) => j.id)

        const { data: allTasks } = await supabase
          .from('journey_tasks')
          .select('journey_id, status')
          .in('journey_id', journeyIds)

        if (allTasks && allTasks.length > 0) {
          const completedCount = allTasks.filter((t) => t.status === 'completed').length
          avgCompletionRate = Math.round((completedCount / allTasks.length) * 100)
        }
      }

      return {
        newJourneys: newJourneys ?? 0,
        milestonesReached: milestonesReached ?? 0,
        atRiskCount: atRiskCount ?? 0,
        avgCompletionRate,
        activeJourneyCount: activeJourneys?.length ?? 0,
      }
    })

    const hrUsers = await step.run('fetch-hr-users', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'hr')

      if (error) throw error
      return data
    })

    for (const hrUser of hrUsers) {
      await step.run(`send-digest-${hrUser.id}`, async () => {
        // Send email
        await sendNotificationEmail(
          hrUser.email,
          'OnboardHero Weekly Digest',
          `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Weekly Onboarding Digest</h2>
            <p>Hi ${hrUser.full_name},</p>
            <p>Here is your weekly onboarding summary:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; color: #6b7280;">New Journeys Started</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${stats.newJourneys}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; color: #6b7280;">Milestones Reached</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${stats.milestonesReached}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; color: #6b7280;">At-Risk Journeys</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${stats.atRiskCount > 0 ? '#dc2626' : '#16a34a'};">${stats.atRiskCount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Avg. Completion Rate</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${stats.avgCompletionRate}%</td>
              </tr>
            </table>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                 style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
                View Dashboard
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">— OnboardHero</p>
          </div>
          `
        )

        // Create in-app notification
        await supabase.from('notifications').insert({
          user_id: hrUser.id,
          type: 'milestone',
          title: 'Weekly Onboarding Digest',
          message: `This week: ${stats.newJourneys} new journeys, ${stats.milestonesReached} milestones reached, ${stats.atRiskCount} at-risk. Avg completion: ${stats.avgCompletionRate}%.`,
          action_url: '/dashboard',
        })
      })
    }

    return {
      stats,
      recipientCount: hrUsers.length,
    }
  }
)
