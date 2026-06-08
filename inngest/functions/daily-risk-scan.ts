import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { analyzeJourneyFriction } from '@/lib/ai/friction-analysis'
import { getJourneyMutations } from '@/lib/ai/journey-manager'
import { postToSlack, riskAlertSlackMessage } from '@/lib/slack'

let TASK_OVERDUE_DAYS = 3
let HIRE_INACTIVE_DAYS = 5
let RISK_ALERT_THRESHOLD = 60
let LOW_MORALE_THRESHOLD = 2
const NEGATIVE_KEYWORDS = ['frustrated', 'confused', 'stuck', 'overwhelmed', 'unclear', "don't understand", 'help', 'lost', 'problem', 'issue', 'difficult', 'hard', 'struggle']
const POSITIVE_KEYWORDS  = ['thank', 'great', 'helpful', 'awesome', 'progress', 'excited', 'clear', 'good', 'love', 'amazing', 'excellent']

/** Derive a 0–1 sentiment score from recent chat messages for a journey */
async function computeSentimentScore(supabase: ReturnType<typeof createSupabaseAdmin>, journeyId: string): Promise<number> {
  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('messages')
    .eq('journey_id', journeyId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!conversations?.length) return 0.5 // neutral default

  const allText = conversations
    .flatMap((c: any) => (c.messages ?? []) as { role: string; content: string }[])
    .filter(m => m.role === 'user')
    .map(m => m.content?.toLowerCase() ?? '')
    .join(' ')

  if (!allText.trim()) return 0.5

  const negHits = NEGATIVE_KEYWORDS.filter(k => allText.includes(k)).length
  const posHits = POSITIVE_KEYWORDS.filter(k => allText.includes(k)).length
  const total   = negHits + posHits
  if (total === 0) return 0.5

  // 0 = very negative, 1 = very positive
  return Math.round((posHits / total) * 100) / 100
}

export const dailyRiskScan = inngest.createFunction(
  { id: 'daily-risk-scan', name: 'Daily Risk Scan', triggers: [{ cron: '0 8 * * *' }] },
  async ({ step }) => {
    const supabase = createSupabaseAdmin()

    // Load configurable thresholds from HR settings (falls back to defaults if not set)
    await step.run('load-thresholds', async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('value')
        .eq('key', 'ai')
        .single()
      if (data?.value) {
        const ai = data.value as Record<string, unknown>
        if (typeof ai.taskOverdueDays   === 'number') TASK_OVERDUE_DAYS    = ai.taskOverdueDays
        if (typeof ai.hireInactiveDays  === 'number') HIRE_INACTIVE_DAYS   = ai.hireInactiveDays
        if (typeof ai.riskThreshold     === 'number') RISK_ALERT_THRESHOLD = ai.riskThreshold
        if (typeof ai.lowMoraleThreshold === 'number') LOW_MORALE_THRESHOLD = ai.lowMoraleThreshold
      }
    })

    const journeys = await step.run('fetch-active-journeys', async () => {
      const { data, error } = await supabase
        .from('journeys')
        .select('id, employee_id, manager_id, start_date, current_week, risk_score, status')
        .in('status', ['in_progress', 'at_risk'])

      if (error) throw error
      return data
    })

    const results: Array<any> = []
    const BATCH_SIZE = 10

    // Process journeys in batches of 10 to stay within Groq rate limits
    for (let i = 0; i < journeys.length; i += BATCH_SIZE) {
      const batch = journeys.slice(i, i + BATCH_SIZE)

      const batchSettled = await Promise.allSettled(
        batch.map(journey =>
          step.run(`scan-journey-${journey.id}`, async () => {
            const { data: tasks }       = await supabase.from('journey_tasks').select('*').eq('journey_id', journey.id)
            const { data: checkIns }    = await supabase.from('check_ins').select('*').eq('journey_id', journey.id)
            const { data: pulseChecks } = await supabase.from('pulse_checks').select('week, score, note').eq('journey_id', journey.id).order('week', { ascending: true })

            // LLM friction analysis with exponential backoff
            let analysis: Awaited<ReturnType<typeof analyzeJourneyFriction>>
            for (let attempt = 1; ; attempt++) {
              try {
                analysis = await analyzeJourneyFriction({ journey, tasks: tasks || [], checkIns: checkIns || [], pulseChecks: pulseChecks || [] })
                break
              } catch (err) {
                if (attempt >= 3) throw err
                await new Promise(r => setTimeout(r, 2 ** attempt * 500))
              }
            }

            // Adaptive mutations — generate and persist ADD_TASK mutations to journey_tasks
            const mutations = await getJourneyMutations(journey.id, analysis!.frictionPoints, tasks || [])

            const currentWeek = journey.current_week ?? 1
            for (const m of mutations) {
              if (m.type === 'ADD_TASK' && m.taskTitle) {
                const alreadyExists = (tasks || []).some(
                  (t: any) => t.title === m.taskTitle && t.week === currentWeek
                )
                if (!alreadyExists) {
                  await supabase.from('journey_tasks').insert({
                    journey_id:       journey.id,
                    title:            m.taskTitle,
                    description:      m.taskDescription ?? m.reason,
                    week:             currentWeek,
                    status:           'pending',
                    assigned_to_role: 'new_hire',
                    source:           'ai_mutation',
                  })
                }
              } else if (m.type === 'PRIORITIZE' && m.affectedTaskId) {
                await supabase.from('journey_tasks')
                  .update({ ai_priority: true })
                  .eq('id', m.affectedTaskId)
                  .eq('journey_id', journey.id)
              }
            }

            const sentimentScore = await computeSentimentScore(supabase, journey.id)
            const newStatus = analysis!.riskScore > RISK_ALERT_THRESHOLD ? 'at_risk' : analysis!.riskScore <= 30 ? 'in_progress' : journey.status

            const { error: updateError } = await supabase
              .from('journeys')
              .upsert({
                id:              journey.id,
                risk_score:      analysis!.riskScore,
                sentiment_score: sentimentScore,
                risk_reasons:    JSON.stringify({ summary: analysis!.summary, points: analysis!.frictionPoints, mutations }),
                friction_points: analysis!.frictionPoints,
                status:          newStatus,
                updated_at:      new Date().toISOString(),
              }, { onConflict: 'id' })

            if (updateError) {
              console.error(`[daily-risk-scan] upsert failed for journey ${journey.id}:`, updateError.message)
            }

            return { journeyId: journey.id, analysis: analysis!, sentimentScore, managerId: journey.manager_id, tasks: tasks ?? [], checkIns: checkIns ?? [] }
          })
        )
      )

      // Process each settled result — skip failed ones
      for (let j = 0; j < batchSettled.length; j++) {
        const settled = batchSettled[j]
        const journey = batch[j]
        if (settled.status === 'rejected') continue

        const result = settled.value
        results.push(result)

        // Risk alert notifications
        if (result.analysis.riskScore > RISK_ALERT_THRESHOLD) {
          await step.run(`notify-risk-${journey.id}`, async () => {
            await supabase.from('notifications').insert({
              user_id:    journey.manager_id,
              type:       'risk_alert',
              title:      'AI Pulse: At-Risk Onboarding',
              message:    result.analysis.summary,
              action_url: `/manager/dashboard?journey=${journey.id}`,
            })
            const { data: hrUsers } = await supabase.from('profiles').select('id').eq('role', 'hr')
            if (hrUsers?.length) {
              await supabase.from('notifications').insert(
                hrUsers.map((hr: any) => ({
                  user_id:    hr.id,
                  type:       'risk_alert' as const,
                  title:      'High Friction Detected',
                  message:    `Journey ${journey.id}: ${result.analysis.summary}`,
                  action_url: `/hr/dashboard?journey=${journey.id}`,
                }))
              )
            }
            // Slack — only fire for critical (threshold + 10) to avoid noise
            if (result.analysis.riskScore > RISK_ALERT_THRESHOLD + 10) {
              const [{ data: emp }, { data: mgr }] = await Promise.all([
                supabase.from('profiles').select('full_name').eq('id', journey.employee_id).single(),
                supabase.from('profiles').select('full_name').eq('id', journey.manager_id).single(),
              ])
              await postToSlack(riskAlertSlackMessage(
                emp?.full_name ?? 'Unknown hire',
                mgr?.full_name ?? 'Unknown manager',
                result.analysis.riskScore,
                result.analysis.summary,
              ))
            }
          })
        }

        // Fire journey/task.overdue for tasks stuck past their week
        await step.run(`check-overdue-${journey.id}`, async () => {
          const now = new Date()
          const startDate = new Date(journey.start_date)

          for (const task of result.tasks) {
            if (task.status === 'completed') continue
            const taskDeadline = new Date(startDate)
            taskDeadline.setDate(taskDeadline.getDate() + task.week * 7 + TASK_OVERDUE_DAYS)

            const daysUntil = Math.ceil((taskDeadline.getTime() - now.getTime()) / 86400000)

            if (now > taskDeadline) {
              // Already overdue — fire event (triggers manager re-scan) + notify hire
              const { data: existingMgr } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', journey.manager_id)
                .ilike('action_url', `%task=${task.id}%`)
                .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .limit(1)

              if (!existingMgr?.length) {
                await inngest.send({
                  name: 'journey/task.overdue',
                  data: { journeyId: journey.id, taskId: task.id, taskTitle: task.title, employeeId: journey.employee_id },
                })
                // Notify the hire directly so they know to act
                await supabase.from('notifications').insert({
                  user_id:    journey.employee_id,
                  type:       'task_due',
                  title:      'Overdue Task',
                  message:    `"${task.title}" is overdue. Complete it as soon as possible to stay on track.`,
                  action_url: '/hire/tasks',
                })
              }
            } else if (daysUntil <= 2 && daysUntil >= 0) {
              // 48h advance warning to hire
              const { data: existingDue } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', journey.employee_id)
                .eq('type', 'task_due')
                .ilike('action_url', '%/hire/tasks%')
                .ilike('message', `%"${task.title}"%`)
                .gte('created_at', new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString())
                .limit(1)

              if (!existingDue?.length) {
                const label = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : 'in 2 days'
                await supabase.from('notifications').insert({
                  user_id:    journey.employee_id,
                  type:       'task_due',
                  title:      'Task Due Soon',
                  message:    `"${task.title}" is due ${label}. Complete it to keep your onboarding on track.`,
                  action_url: '/hire/tasks',
                })
              }
            }
          }
        })

        // Fire journey/hire.inactive if no recent chat activity
        await step.run(`check-inactive-${journey.id}`, async () => {
          const cutoff = new Date(Date.now() - HIRE_INACTIVE_DAYS * 24 * 60 * 60 * 1000).toISOString()
          const { data: recentConvo } = await supabase
            .from('ai_conversations')
            .select('id')
            .eq('journey_id', journey.id)
            .gte('created_at', cutoff)
            .limit(1)

          if (!recentConvo?.length) {
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', journey.manager_id)
              .ilike('title', '%Inactive%')
              .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
              .limit(1)

            if (!existing?.length) {
              await inngest.send({
                name: 'journey/hire.inactive',
                data: { journeyId: journey.id, employeeId: journey.employee_id, inactiveDays: HIRE_INACTIVE_DAYS },
              })
            }
          }
        })

        // #1 — Velocity decay alert: task completion rate declining 3 weeks in a row
        await step.run(`check-velocity-decay-${journey.id}`, async () => {
          const tasksByWeek: Record<number, { total: number; done: number }> = {}
          for (const task of result.tasks) {
            const w = task.week ?? 1
            if (!tasksByWeek[w]) tasksByWeek[w] = { total: 0, done: 0 }
            tasksByWeek[w].total++
            if (task.status === 'completed') tasksByWeek[w].done++
          }

          const weekNums = Object.keys(tasksByWeek).map(Number).sort((a, b) => a - b)
          if (weekNums.length < 3) return

          const lastThree = weekNums.slice(-3)
          const rates = lastThree.map(w => tasksByWeek[w].total > 0 ? tasksByWeek[w].done / tasksByWeek[w].total : 0)
          const isDecaying = rates[0] > rates[1] && rates[1] > rates[2]

          if (!isDecaying) return

          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', journey.manager_id)
            .ilike('title', '%Velocity Decay%')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1)

          if (!existing?.length) {
            const pct = (r: number) => `${Math.round(r * 100)}%`
            await supabase.from('notifications').insert({
              user_id:    journey.manager_id,
              type:       'risk_alert',
              title:      'Velocity Decay Detected',
              message:    `Task completion rate has dropped 3 weeks in a row: ${pct(rates[0])} → ${pct(rates[1])} → ${pct(rates[2])}. Intervention recommended.`,
              action_url: `/manager/team/${journey.id}`,
            })
          }
        })

        // #10 — Escalation: 14+ days at_risk with no manager action → notify HR
        await step.run(`check-escalation-${journey.id}`, async () => {
          if (journey.status !== 'at_risk') return

          const cutoff14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

          // Journey must have been at_risk since before the 14-day window
          const { data: oldAlert } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', journey.manager_id)
            .eq('type', 'risk_alert')
            .ilike('action_url', `%${journey.id}%`)
            .lt('created_at', cutoff14d)
            .limit(1)

          if (!oldAlert?.length) return

          // Check if manager has taken any action in last 14 days
          const { data: managerActions } = await supabase
            .from('action_log')
            .select('id')
            .eq('journey_id', journey.id)
            .eq('actor_role', 'manager')
            .gte('created_at', cutoff14d)
            .limit(1)

          if (managerActions?.length) return

          // No manager action in 14 days — escalate to HR
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .ilike('title', '%HR Escalation%')
            .ilike('action_url', `%${journey.id}%`)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1)

          if (existing?.length) return

          const { data: hrUsers } = await supabase.from('profiles').select('id').eq('role', 'hr')
          if (!hrUsers?.length) return

          await supabase.from('notifications').insert(
            hrUsers.map((hr: any) => ({
              user_id:    hr.id,
              type:       'risk_alert' as const,
              title:      'HR Escalation Required',
              message:    `Journey ${journey.id} has been at-risk for 14+ days with no manager action. Immediate HR review recommended.`,
              action_url: `/hr/dashboard?journey=${journey.id}`,
            }))
          )
        })

        // #6 — Pulse alert: sustained score ≤ 3 for 3 consecutive weeks
        await step.run(`check-pulse-sustained-${journey.id}`, async () => {
          const { data: pulseRows } = await supabase
            .from('pulse_checks')
            .select('week, score')
            .eq('journey_id', journey.id)
            .order('week', { ascending: false })
            .limit(3)

          if (pulseRows && pulseRows.length === 3 && pulseRows.every((p: any) => p.score <= LOW_MORALE_THRESHOLD + 1)) {
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', journey.manager_id)
              .ilike('title', '%Sustained Low Morale%')
              .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
              .limit(1)

            if (!existing?.length) {
              await supabase.from('notifications').insert({
                user_id:    journey.manager_id,
                type:       'risk_alert',
                title:      'Sustained Low Morale Alert',
                message:    `Your hire has rated 3 consecutive weeks at ≤3/5 on the pulse check. Immediate intervention recommended.`,
                action_url: `/manager/dashboard?journey=${journey.id}`,
              })
            }
          }
        })
      }

      // Pause between batches to respect Groq rate limits
      if (i + BATCH_SIZE < journeys.length) {
        await step.sleep('batch-cooldown', '2s')
      }
    }

    return {
      scannedCount: journeys.length,
      atRiskCount:  results.filter(r => r.analysis.riskScore > RISK_ALERT_THRESHOLD).length,
      results,
    }
  }
)
