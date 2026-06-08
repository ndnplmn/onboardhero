import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { analyzeJourneyFriction } from '@/lib/ai/friction-analysis'

export const onMoraleLow = inngest.createFunction(
  { id: 'on-morale-low', name: 'Re-scan on Low Morale', triggers: [{ event: 'journey/morale.low' }] },
  async ({ event, step }: { event: any; step: any }) => {
    const { journeyId, employeeId, week, score } = event.data as {
      journeyId: string
      employeeId: string
      week: number
      score: number
    }

    const supabase = createSupabaseAdmin()

    const analysis = await step.run('analyze-friction', async () => {
      const { data: journey } = await supabase.from('journeys').select('*').eq('id', journeyId).single()
      const { data: tasks }   = await supabase.from('journey_tasks').select('*').eq('journey_id', journeyId)
      const { data: checkIns } = await supabase.from('check_ins').select('*').eq('journey_id', journeyId)
      if (!journey) throw new Error(`Journey ${journeyId} not found`)
      return analyzeJourneyFriction({ journey, tasks: tasks || [], checkIns: checkIns || [] })
    })

    await step.run('update-risk', async () => {
      const newScore = Math.max(analysis.riskScore, score <= 1 ? 75 : 55)
      await supabase.from('journeys').update({
        risk_score: newScore,
        risk_reasons: JSON.stringify({ summary: analysis.summary, points: analysis.frictionPoints }),
        ...(newScore > 60 ? { status: 'at_risk' } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', journeyId)
    })

    const { data: journey } = await supabase.from('journeys').select('manager_id').eq('id', journeyId).single()

    await step.run('notify-manager', async () => {
      if (!journey?.manager_id) return
      const moodLabel = ['', 'Very Unhappy', 'Unhappy', 'Neutral', 'Happy', 'Very Happy'][score] ?? 'Low'
      await supabase.from('notifications').insert({
        user_id: journey.manager_id,
        type: 'risk_alert',
        title: `Morale Alert — Week ${week} Pulse`,
        message: `Your hire rated their week ${score}/5 (${moodLabel}). Risk re-scan triggered. ${analysis.summary}`,
        action_url: `/manager/dashboard?journey=${journeyId}`,
      })
    })

    return { journeyId, week, score, newRiskScore: analysis.riskScore }
  }
)
