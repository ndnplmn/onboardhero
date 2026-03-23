import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export const dailyRiskScan = inngest.createFunction(
  { id: 'daily-risk-scan', name: 'Daily Risk Scan', triggers: [{ cron: '0 8 * * *' }] },
  async ({ step }) => {
    const supabase = createSupabaseAdmin()

    const journeys = await step.run('fetch-active-journeys', async () => {
      const { data, error } = await supabase
        .from('journeys')
        .select('id, employee_id, manager_id, start_date, current_week, risk_score, status')
        .in('status', ['in_progress', 'at_risk'])

      if (error) throw error
      return data
    })

    const results: Array<{ journeyId: string; riskScore: number; reasons: string[] }> = []

    for (const journey of journeys) {
      const result = await step.run(`scan-journey-${journey.id}`, async () => {
        // Fetch tasks for this journey
        const { data: tasks, error: tasksError } = await supabase
          .from('journey_tasks')
          .select('id, week, status, completed_at')
          .eq('journey_id', journey.id)

        if (tasksError) throw tasksError

        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t) => t.status === 'completed').length
        const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 1

        // Calculate overdue tasks: tasks from weeks <= current_week that aren't completed/skipped
        const overdueTasks = tasks.filter(
          (t) => t.week <= journey.current_week && t.status !== 'completed' && t.status !== 'skipped'
        )
        const overdueCount = overdueTasks.length

        // Calculate expected completion rate based on current week
        const tasksUpToCurrentWeek = tasks.filter((t) => t.week <= journey.current_week).length
        const expectedCompletionRate =
          totalTasks > 0 ? tasksUpToCurrentWeek / totalTasks : 0

        // Days since start
        const startDate = new Date(journey.start_date)
        const now = new Date()
        const daysSinceStart = Math.floor(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Find last activity (most recent completed_at)
        const completedDates = tasks
          .filter((t) => t.completed_at)
          .map((t) => new Date(t.completed_at!).getTime())
        const lastActivity = completedDates.length > 0 ? Math.max(...completedDates) : startDate.getTime()
        const daysSinceLastActivity = Math.floor(
          (now.getTime() - lastActivity) / (1000 * 60 * 60 * 24)
        )

        // Risk scoring
        const reasons: string[] = []

        // Overdue tasks (weight: 40%)
        const overdueScore = totalTasks > 0
          ? Math.min((overdueCount / totalTasks) * 100, 100) * 0.4
          : 0
        if (overdueCount > 0) {
          reasons.push(`${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} from current and prior weeks`)
        }

        // Completion velocity vs expected (weight: 30%)
        const velocityGap = expectedCompletionRate - completionRate
        const velocityScore = Math.max(velocityGap, 0) * 100 * 0.3
        if (velocityGap > 0.2) {
          reasons.push(
            `Completion rate (${Math.round(completionRate * 100)}%) is behind expected (${Math.round(expectedCompletionRate * 100)}%)`
          )
        }

        // Days since last activity (weight: 30%)
        let activityScore = 0
        if (daysSinceLastActivity > 14) {
          activityScore = 30
          reasons.push(`No activity in ${daysSinceLastActivity} days`)
        } else if (daysSinceLastActivity > 7) {
          activityScore = 20
          reasons.push(`Low activity: last action ${daysSinceLastActivity} days ago`)
        } else if (daysSinceLastActivity > 3) {
          activityScore = 10
        }

        const riskScore = Math.round(
          Math.min(overdueScore + velocityScore + activityScore, 100)
        )

        const newStatus =
          riskScore > 60 ? 'at_risk' : riskScore <= 30 ? 'in_progress' : journey.status

        // Update journey
        const { error: updateError } = await supabase
          .from('journeys')
          .update({
            risk_score: riskScore,
            risk_reasons: reasons,
            status: newStatus,
          })
          .eq('id', journey.id)

        if (updateError) throw updateError

        return { journeyId: journey.id, riskScore, reasons, managerId: journey.manager_id }
      })

      results.push(result)

      // Create notifications for high-risk journeys
      if (result.riskScore > 60) {
        await step.run(`notify-risk-${journey.id}`, async () => {
          // Notify manager
          await supabase.from('notifications').insert({
            user_id: journey.manager_id,
            type: 'risk_alert',
            title: 'At-Risk Onboarding Journey',
            message: `Risk score: ${result.riskScore}/100. ${result.reasons.join('. ')}`,
            action_url: `/journeys/${journey.id}`,
          })

          // Notify all HR users
          const { data: hrUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'hr')

          if (hrUsers && hrUsers.length > 0) {
            await supabase.from('notifications').insert(
              hrUsers.map((hr) => ({
                user_id: hr.id,
                type: 'risk_alert' as const,
                title: 'At-Risk Onboarding Journey',
                message: `Risk score: ${result.riskScore}/100. ${result.reasons.join('. ')}`,
                action_url: `/journeys/${journey.id}`,
              }))
            )
          }
        })
      }
    }

    return {
      scannedCount: journeys.length,
      atRiskCount: results.filter((r) => r.riskScore > 60).length,
      results,
    }
  }
)
