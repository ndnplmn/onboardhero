import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { sendNotificationEmail } from '@/lib/email/resend'
import { weeklyDigestEmailTemplate, managerWeeklyDigestTemplate } from '@/lib/email/templates'

export const weeklyDigest = inngest.createFunction(
  { id: 'weekly-digest', name: 'Weekly Digest', triggers: [{ cron: '0 8 * * 1' }] },
  async ({ step }) => {
    const supabase = createSupabaseAdmin()

    // ── Org-wide stats for HR digest ────────────────────────────────────────
    const stats = await step.run('calculate-weekly-stats', async () => {
      const oneWeekAgo    = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const oneWeekAgoISO = oneWeekAgo.toISOString()

      const { count: newJourneys } = await supabase
        .from('journeys')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgoISO)

      const { count: milestonesReached } = await supabase
        .from('check_ins')
        .select('id', { count: 'exact', head: true })
        .gte('completed_date', oneWeekAgo.toISOString().split('T')[0])

      const { count: atRiskCount } = await supabase
        .from('journeys')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'at_risk')

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
        newJourneys:        newJourneys ?? 0,
        milestonesReached:  milestonesReached ?? 0,
        atRiskCount:        atRiskCount ?? 0,
        avgCompletionRate,
        activeJourneyCount: activeJourneys?.length ?? 0,
      }
    })

    // ── HR digests ───────────────────────────────────────────────────────────
    const hrUsers = await step.run('fetch-hr-users', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'hr')
      if (error) throw error
      return data ?? []
    })

    for (const hrUser of hrUsers) {
      await step.run(`send-hr-digest-${hrUser.id}`, async () => {
        await sendNotificationEmail(
          hrUser.email,
          'OnboardHero: your weekly onboarding digest',
          weeklyDigestEmailTemplate({ hrName: hrUser.full_name, stats })
        )
        await supabase.from('notifications').insert({
          user_id:    hrUser.id,
          type:       'milestone',
          title:      'Weekly Onboarding Digest',
          message:    `This week: ${stats.newJourneys} new journeys, ${stats.milestonesReached} milestones reached, ${stats.atRiskCount} at-risk. Avg completion: ${stats.avgCompletionRate}%.`,
          action_url: '/hr/dashboard',
        })
      })
    }

    // ── Manager digests — personalized per-hire breakdown ────────────────────
    const managers = await step.run('fetch-managers', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'manager')
      if (error) throw error
      return data ?? []
    })

    for (const manager of managers) {
      await step.run(`send-manager-digest-${manager.id}`, async () => {
        // Fetch this manager's active journeys with task completion
        const { data: journeys } = await supabase
          .from('journeys')
          .select('id, status, current_week, risk_score, employee:profiles!employee_id(full_name)')
          .eq('manager_id', manager.id)
          .in('status', ['in_progress', 'at_risk', 'active', 'not_started', 'completed'])

        if (!journeys || journeys.length === 0) return

        const journeyIds = journeys.map((j) => j.id)
        const { data: tasks } = await supabase
          .from('journey_tasks')
          .select('journey_id, status')
          .in('journey_id', journeyIds)

        const taskMap: Record<string, { total: number; done: number }> = {}
        for (const t of tasks ?? []) {
          if (!taskMap[t.journey_id]) taskMap[t.journey_id] = { total: 0, done: 0 }
          taskMap[t.journey_id].total++
          if (t.status === 'completed') taskMap[t.journey_id].done++
        }

        const hires = journeys.map((j: any) => {
          const emp = Array.isArray(j.employee) ? j.employee[0] : j.employee
          const tc  = taskMap[j.id] ?? { total: 0, done: 0 }
          return {
            name:      emp?.full_name ?? 'New Hire',
            week:      j.current_week ?? 0,
            riskScore: j.risk_score   ?? 0,
            taskPct:   tc.total > 0 ? Math.round((tc.done / tc.total) * 100) : 0,
            status:    j.status,
          }
        })

        const atRiskCount = hires.filter(h => h.riskScore > 60).length

        await sendNotificationEmail(
          manager.email,
          `OnboardHero: your ${hires.length} hire${hires.length !== 1 ? 's' : ''} this week`,
          managerWeeklyDigestTemplate({ managerName: manager.full_name, hires })
        )

        await supabase.from('notifications').insert({
          user_id:    manager.id,
          type:       atRiskCount > 0 ? 'risk_alert' : 'milestone',
          title:      'Weekly Team Digest',
          message:    atRiskCount > 0
            ? `${atRiskCount} of your hire${atRiskCount > 1 ? 's need' : ' needs'} attention this week.`
            : `All ${hires.length} of your hires are progressing well this week.`,
          action_url: '/manager/hires',
        })
      })
    }

    return {
      stats,
      hrRecipients:      hrUsers.length,
      managerRecipients: managers.length,
    }
  }
)
