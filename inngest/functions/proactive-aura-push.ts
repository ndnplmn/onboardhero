import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { generateText } from 'ai'
import { model } from '@/lib/ai/groq'

// Daily job: generates a single personalized Aura message for each active hire
// and stores it in action_log so the hire dashboard can surface it.
export const proactiveAuraPush = inngest.createFunction(
  { id: 'proactive-aura-push', name: 'Proactive Aura Push', triggers: [{ cron: '30 9 * * *' }] },
  async ({ step }) => {
    const admin = createSupabaseAdmin()

    // Read org timezone from settings (fallback: UTC)
    let tz = 'UTC'
    const { data: tzSetting } = await admin
      .from('company_settings')
      .select('value')
      .eq('key', 'org')
      .single()
    if (tzSetting?.value && typeof (tzSetting.value as any).timezone === 'string') {
      tz = (tzSetting.value as any).timezone
    }

    // Only run during 9–10am in the org's timezone
    const nowInTz = new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
    const hour = nowInTz.getHours()
    if (hour < 9 || hour >= 10) {
      return { skipped: true, reason: `Outside push window in ${tz} (hour=${hour})` }
    }

    const journeys = await step.run('fetch-active-journeys', async () => {
      const { data } = await admin
        .from('onboarding_journeys')
        .select(`
          id, current_week, risk_score, start_date, status,
          employee:profiles!onboarding_journeys_employee_id_fkey(full_name),
          friction_points
        `)
        .eq('status', 'active')
        .limit(100)
      return data ?? []
    })

    console.info(`Proactive Aura Push: processing ${journeys.length} journeys`)

    let pushed = 0
    for (const journey of journeys) {
      try {
        const hireName   = (journey.employee as any)?.full_name?.split(' ')[0] ?? 'there'
        const week       = journey.current_week ?? 1
        const risk       = journey.risk_score ?? 0
        const fps        = Array.isArray(journey.friction_points) ? journey.friction_points : []
        const fpCount    = fps.filter((f: any) => f.status !== 'resolved').length
        const dayNumber  = journey.start_date
          ? Math.max(1, Math.ceil((Date.now() - new Date(journey.start_date).getTime()) / 86400000))
          : week * 7

        // Get this week's task completion
        const { data: tasks } = await admin
          .from('journey_tasks')
          .select('status, week')
          .eq('journey_id', journey.id)
          .eq('week', week)
        const totalWeekTasks = tasks?.length ?? 0
        const doneWeekTasks  = tasks?.filter((t: any) => t.status === 'completed').length ?? 0

        // Build context string for the LLM
        const context = [
          `Hire name: ${hireName}`,
          `Day ${dayNumber}, Week ${week} of onboarding`,
          `Risk score: ${risk}/100`,
          fpCount > 0 ? `${fpCount} unresolved blocker${fpCount > 1 ? 's' : ''}` : 'No active blockers',
          totalWeekTasks > 0 ? `This week: ${doneWeekTasks}/${totalWeekTasks} tasks completed` : 'No tasks assigned this week',
        ].join('. ')

        const { text } = await generateText({
          model,
          system: [
            'You are Aura, an empathetic onboarding AI assistant.',
            'Generate ONE short, personalized, motivational message (max 2 sentences) for the new hire.',
            'Be specific — reference their week number, a concrete action, or a data point.',
            'Tone: warm, professional, encouraging. Never generic. No emojis.',
            'Output only the message text, nothing else.',
          ].join(' '),
          prompt: context,
        })

        const message = text.trim()
        if (!message) continue

        await admin.from('action_log').insert({
          journey_id:  journey.id,
          actor_id:    null,
          actor_role:  'system',
          action_type: 'proactive_push',
          label:       message,
          metadata:    { week, risk, source: 'proactive_aura_push', day: dayNumber },
        })

        pushed++
      } catch (err) {
        console.warn(`Proactive push failed for journey ${journey.id}: ${err}`)
      }
    }

    return { pushed, total: journeys.length }
  },
)
