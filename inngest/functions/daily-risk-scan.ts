import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { analyzeJourneyFriction } from '@/lib/ai/friction-analysis'
import { getJourneyMutations } from '@/lib/ai/journey-manager'

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

    const results: Array<any> = []

    for (const journey of journeys) {
      const result = await step.run(`scan-journey-${journey.id}`, async () => {
        // Fetch tasks and check-ins
        const { data: tasks } = await supabase
          .from('journey_tasks')
          .select('*')
          .eq('journey_id', journey.id)

        const { data: checkIns } = await supabase
          .from('check_ins')
          .select('*')
          .eq('journey_id', journey.id)

        // Perform LLM Analytics
        const analysis = await analyzeJourneyFriction({ 
          journey, 
          tasks: tasks || [], 
          checkIns: checkIns || [] 
        })

        const newStatus =
          analysis.riskScore > 60 ? 'at_risk' : analysis.riskScore <= 30 ? 'in_progress' : journey.status

        // Step 2: Adaptive Journey Mutations (Phase 3)
        const mutations = await getJourneyMutations(
          journey.id,
          analysis.frictionPoints,
          tasks || []
        )

        // Update journey with high-fidelity AI data
        const { error: updateError } = await supabase
          .from('journeys')
          .update({
            risk_score: analysis.riskScore,
            risk_reasons: JSON.stringify({ 
              summary: analysis.summary, 
              points: analysis.frictionPoints,
              mutations: mutations 
            }),
            friction_points: analysis.frictionPoints,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', journey.id)

        if (updateError) {
          // Fallback if friction_points column doesn't exist yet
          await supabase.from('journeys').update({
            risk_score: analysis.riskScore,
            risk_reasons: JSON.stringify({ summary: analysis.summary, points: analysis.frictionPoints }),
            status: newStatus
          }).eq('id', journey.id)
        }

        return { journeyId: journey.id, analysis, managerId: journey.manager_id }
      })

      results.push(result)

      // Create notifications for high-risk journeys
      if (result.analysis.riskScore > 60) {
        await step.run(`notify-risk-${journey.id}`, async () => {
          // Notify manager
          await supabase.from('notifications').insert({
            user_id: journey.manager_id,
            type: 'risk_alert',
            title: 'AI Pulse: At-Risk Onboarding',
            message: result.analysis.summary,
            action_url: `/manager/dashboard?journey=${journey.id}`,
          })

          // Notify HR
          const { data: hrUsers } = await supabase.from('profiles').select('id').eq('role', 'hr')
          if (hrUsers) {
            await supabase.from('notifications').insert(
              hrUsers.map((hr) => ({
                user_id: hr.id,
                type: 'risk_alert' as const,
                title: 'High Friction Detected',
                message: `Journey for employee ${journey.employee_id} flagged: ${result.analysis.summary}`,
                action_url: `/hr/dashboard?journey=${journey.id}`,
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
