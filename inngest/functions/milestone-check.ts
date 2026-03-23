import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

const MILESTONES = [
  { key: 'day_7', days: 7 },
  { key: 'day_14', days: 14 },
  { key: 'day_30', days: 30 },
  { key: 'day_60', days: 60 },
  { key: 'day_90', days: 90 },
] as const

export const milestoneCheck = inngest.createFunction(
  { id: 'milestone-check', name: 'Daily Milestone Check', triggers: [{ cron: '0 9 * * *' }] },
  async ({ step }) => {
    const supabase = createSupabaseAdmin()

    const journeys = await step.run('fetch-active-journeys', async () => {
      const { data, error } = await supabase
        .from('journeys')
        .select('id, manager_id, employee_id, start_date')
        .in('status', ['in_progress', 'at_risk'])

      if (error) throw error
      return data
    })

    let notificationsCreated = 0

    for (const journey of journeys) {
      const count = await step.run(`check-milestones-${journey.id}`, async () => {
        const now = new Date()
        const startDate = new Date(journey.start_date)
        let created = 0

        // Fetch existing check-ins for this journey
        const { data: checkIns, error: checkInsError } = await supabase
          .from('check_ins')
          .select('milestone, completed_date')
          .eq('journey_id', journey.id)

        if (checkInsError) throw checkInsError

        for (const milestone of MILESTONES) {
          const milestoneDate = new Date(startDate)
          milestoneDate.setDate(milestoneDate.getDate() + milestone.days)

          // Skip if milestone date hasn't passed yet
          if (milestoneDate > now) continue

          // Check if a completed check-in exists for this milestone
          const completedCheckIn = checkIns?.find(
            (ci) => ci.milestone === milestone.key && ci.completed_date !== null
          )

          if (completedCheckIn) continue

          // Check if we already sent a reminder recently (within last 24h)
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', journey.manager_id)
            .eq('type', 'checkin_reminder')
            .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
            .like('action_url', `%${journey.id}%`)
            .limit(1)

          if (existingNotif && existingNotif.length > 0) continue

          // Look up employee name for the notification
          const { data: employee } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', journey.employee_id)
            .single()

          const employeeName = employee?.full_name ?? 'New hire'

          await supabase.from('notifications').insert({
            user_id: journey.manager_id,
            type: 'checkin_reminder',
            title: `Overdue Check-in: ${milestone.key.replace('_', ' ')}`,
            message: `The ${milestone.key.replace('_', ' ')} check-in with ${employeeName} is overdue. Please schedule it soon.`,
            action_url: `/journeys/${journey.id}`,
          })

          created++
        }

        return created
      })

      notificationsCreated += count
    }

    return {
      journeysChecked: journeys.length,
      notificationsCreated,
    }
  }
)
