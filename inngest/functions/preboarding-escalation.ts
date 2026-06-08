import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

// Runs daily at 7am ET — finds hires whose start_date is within 48h
// and who have incomplete preboarding tasks, then notifies HR.
export const preboardingEscalation = inngest.createFunction(
  { id: 'preboarding-escalation', name: 'Preboarding Blocker Escalation', triggers: [{ cron: 'TZ=America/New_York 0 7 * * *' }] },
  async ({ step }) => {
    const admin = createSupabaseAdmin()

    const nearStartJourneys = await step.run('fetch-near-start-journeys', async () => {
      const now   = new Date()
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
      const { data } = await admin
        .from('onboarding_journeys')
        .select('id, start_date, employee_id, template')
        .eq('status', 'active')
        .gte('start_date', now.toISOString())
        .lte('start_date', in48h.toISOString())
      return data ?? []
    })

    let escalated = 0

    for (const journey of nearStartJourneys) {
      const template = Array.isArray(journey.template) ? journey.template[0] : journey.template
      const preboardingTasks: { id: string; title: string }[] = template?.preboarding_tasks ?? []
      if (preboardingTasks.length === 0) continue

      // Check localStorage-persisted completions stored in action_log
      const { data: completedActions } = await admin
        .from('action_log')
        .select('metadata')
        .eq('journey_id', journey.id)
        .eq('action_type', 'task_completed')
        .eq('actor_role', 'hire')

      const completedIds = new Set(
        (completedActions ?? []).map((a: any) => a.metadata?.taskId).filter(Boolean)
      )

      const incomplete = preboardingTasks.filter(t => !completedIds.has(t.id))
      if (incomplete.length === 0) continue

      // Avoid duplicate alerts within 24h
      const { data: existing } = await admin
        .from('notifications')
        .select('id')
        .ilike('title', '%Preboarding Blocker%')
        .ilike('action_url', `%${journey.id}%`)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)

      if (existing?.length) continue

      const { data: hrUsers } = await admin.from('profiles').select('id').eq('role', 'hr')
      const { data: emp }     = await admin.from('profiles').select('full_name').eq('id', journey.employee_id).single()
      const hireName = emp?.full_name ?? 'A new hire'
      const startDate = new Date(journey.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      if (hrUsers?.length) {
        await admin.from('notifications').insert(
          hrUsers.map((hr: any) => ({
            user_id:    hr.id,
            type:       'risk_alert' as const,
            title:      'Preboarding Blocker Alert',
            message:    `${hireName} starts on ${startDate} and has ${incomplete.length} incomplete preboarding task${incomplete.length > 1 ? 's' : ''}: "${incomplete[0].title}"${incomplete.length > 1 ? ` +${incomplete.length - 1} more` : ''}. Follow up to ensure day-1 readiness.`,
            action_url: `/hr/employees/${journey.employee_id}`,
          }))
        )
        escalated++
      }
    }

    return { checked: nearStartJourneys.length, escalated }
  },
)
