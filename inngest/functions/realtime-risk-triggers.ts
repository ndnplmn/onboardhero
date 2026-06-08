import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { analyzeJourneyFriction } from '@/lib/ai/friction-analysis'

// ── Trigger: task overdue ─────────────────────────────────────────────────────
// Fire this event from any route that detects a task past its due date:
//   await inngest.send({ name: 'journey/task.overdue', data: { journeyId, managerId, daysOverdue } })

export const onTaskOverdue = inngest.createFunction(
  { id: 'on-task-overdue', name: 'Re-scan on Task Overdue', triggers: [{ event: 'journey/task.overdue' }] },
  async ({ event, step }: { event: any; step: any }) => {
    const { journeyId, managerId, daysOverdue } = event.data as {
      journeyId: string
      managerId: string
      daysOverdue: number
    }

    if (daysOverdue < 3) return { skipped: true }

    const supabase = createSupabaseAdmin()

    const analysis = await step.run('analyze-friction', async () => {
      const { data: journey }  = await supabase.from('journeys').select('*').eq('id', journeyId).single()
      const { data: tasks }    = await supabase.from('journey_tasks').select('*').eq('journey_id', journeyId)
      const { data: checkIns } = await supabase.from('check_ins').select('*').eq('journey_id', journeyId)
      if (!journey) throw new Error(`Journey ${journeyId} not found`)
      return analyzeJourneyFriction({ journey, tasks: tasks || [], checkIns: checkIns || [] })
    })

    await step.run('update-risk-score', async () => {
      await supabase.from('journeys').update({
        risk_score: analysis.riskScore,
        risk_reasons: JSON.stringify({ summary: analysis.summary, points: analysis.frictionPoints }),
        ...(analysis.riskScore > 60 ? { status: 'at_risk' } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', journeyId)
    })

    if (analysis.riskScore > 60) {
      await step.run('notify-manager', async () => {
        await supabase.from('notifications').insert({
          user_id: managerId,
          type: 'risk_alert',
          title: 'Risk Signal: Overdue Task',
          message: `Overdue task triggered a re-scan. Risk score: ${analysis.riskScore}. ${analysis.summary}`,
          action_url: `/manager/dashboard?journey=${journeyId}`,
        })
      })
    }

    return { journeyId, newRiskScore: analysis.riskScore }
  }
)

// ── Trigger: hire inactivity ──────────────────────────────────────────────────
// Fire this event from daily-risk-scan when activity_log shows no logins in 5+ days:
//   await inngest.send({ name: 'journey/hire.inactive', data: { journeyId, managerId, inactiveDays } })

export const onHireInactive = inngest.createFunction(
  { id: 'on-hire-inactive', name: 'Re-scan on Hire Inactivity', triggers: [{ event: 'journey/hire.inactive' }] },
  async ({ event, step }: { event: any; step: any }) => {
    const { journeyId, managerId, inactiveDays } = event.data as {
      journeyId: string
      managerId: string
      inactiveDays: number
    }

    const supabase = createSupabaseAdmin()

    const analysis = await step.run('analyze-friction', async () => {
      const { data: journey }  = await supabase.from('journeys').select('*').eq('id', journeyId).single()
      const { data: tasks }    = await supabase.from('journey_tasks').select('*').eq('journey_id', journeyId)
      const { data: checkIns } = await supabase.from('check_ins').select('*').eq('journey_id', journeyId)
      if (!journey) throw new Error(`Journey ${journeyId} not found`)
      return analyzeJourneyFriction({ journey, tasks: tasks || [], checkIns: checkIns || [] })
    })

    await step.run('update-risk', async () => {
      await supabase.from('journeys').update({
        risk_score: analysis.riskScore,
        risk_reasons: JSON.stringify({ summary: analysis.summary, points: analysis.frictionPoints }),
        ...(analysis.riskScore > 60 ? { status: 'at_risk' } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', journeyId)
    })

    await step.run('notify-manager', async () => {
      await supabase.from('notifications').insert({
        user_id: managerId,
        type: 'risk_alert',
        title: `Inactivity Alert — ${inactiveDays} days offline`,
        message: `Your hire has not logged in for ${inactiveDays} days. Risk score: ${analysis.riskScore}. Consider sending a nudge.`,
        action_url: `/manager/dashboard?journey=${journeyId}`,
      })
    })

    return { journeyId, inactiveDays, newRiskScore: analysis.riskScore }
  }
)

// ── Trigger: check-in missed ──────────────────────────────────────────────────
// Fire this event from milestone-check when a scheduled check-in passes without completion:
//   await inngest.send({ name: 'journey/checkin.missed', data: { journeyId, managerId, checkInType, scheduledDate } })

export const onCheckInMissed = inngest.createFunction(
  { id: 'on-checkin-missed', name: 'Re-scan on Missed Check-in', triggers: [{ event: 'journey/checkin.missed' }] },
  async ({ event, step }: { event: any; step: any }) => {
    const { journeyId, managerId, checkInType } = event.data as {
      journeyId: string
      managerId: string
      checkInType: string
      scheduledDate: string
    }

    const supabase = createSupabaseAdmin()

    const analysis = await step.run('analyze-friction', async () => {
      const { data: journey }  = await supabase.from('journeys').select('*').eq('id', journeyId).single()
      const { data: tasks }    = await supabase.from('journey_tasks').select('*').eq('journey_id', journeyId)
      const { data: checkIns } = await supabase.from('check_ins').select('*').eq('journey_id', journeyId)
      if (!journey) throw new Error(`Journey ${journeyId} not found`)
      return analyzeJourneyFriction({ journey, tasks: tasks || [], checkIns: checkIns || [] })
    })

    await step.run('update-risk', async () => {
      await supabase.from('journeys').update({
        risk_score: analysis.riskScore,
        risk_reasons: JSON.stringify({ summary: analysis.summary, points: analysis.frictionPoints }),
        ...(analysis.riskScore > 60 ? { status: 'at_risk' } : {}),
        updated_at: new Date().toISOString(),
      }).eq('id', journeyId)
    })

    await step.run('notify-manager', async () => {
      const labelMap: Record<string, string> = { day_7: '7-Day', day_30: '30-Day', day_60: '60-Day', day_90: '90-Day' }
      const label = labelMap[checkInType] ?? 'Milestone'
      await supabase.from('notifications').insert({
        user_id: managerId,
        type: 'risk_alert',
        title: `Missed ${label} Check-in`,
        message: `The ${label} check-in was not completed. Risk score: ${analysis.riskScore}. Schedule it now.`,
        action_url: `/manager/calendar`,
      })
    })

    return { journeyId, checkInType, newRiskScore: analysis.riskScore }
  }
)
