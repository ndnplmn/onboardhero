import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getTeamProgress(managerId: string) {
  return tool({
    description:
      'Get an overview of all team members and their onboarding progress. Returns employee names, journey status, task completion percentage, and risk scores.',
    inputSchema: z.object({
      statusFilter: z
        .enum(['in_progress', 'at_risk', 'not_started', 'completed'])
        .optional()
        .describe('Optionally filter by journey status'),
    }),
    execute: async ({ statusFilter }) => {
      const supabase = createSupabaseAdmin()

      let query = supabase
        .from('journeys')
        .select('id, status, current_week, risk_score, risk_reasons, sentiment_score, start_date, employee:profiles!employee_id(id, full_name, email, department)')
        .eq('manager_id', managerId)
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      } else {
        query = query.in('status', ['in_progress', 'at_risk', 'not_started'])
      }

      const { data: journeys, error } = await query

      if (error) {
        return { error: `Failed to fetch team progress: ${error.message}` }
      }

      if (!journeys || journeys.length === 0) {
        return { team: [], summary: 'No active team members found.' }
      }

      // Get task counts for each journey
      const journeyIds = journeys.map((j: any) => j.id)
      const { data: tasks } = await supabase
        .from('journey_tasks')
        .select('journey_id, status')
        .in('journey_id', journeyIds)

      const tasksByJourney: Record<string, { total: number; completed: number }> = {}
      for (const t of tasks || []) {
        if (!tasksByJourney[t.journey_id]) {
          tasksByJourney[t.journey_id] = { total: 0, completed: 0 }
        }
        tasksByJourney[t.journey_id].total++
        if (t.status === 'completed') {
          tasksByJourney[t.journey_id].completed++
        }
      }

      const team = journeys.map((j: any) => {
        const counts = tasksByJourney[j.id] || { total: 0, completed: 0 }
        const progress = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0
        return {
          journeyId: j.id,
          employeeId: j.employee?.id,
          name: j.employee?.full_name || 'Unknown',
          department: j.employee?.department || 'General',
          status: j.status,
          currentWeek: j.current_week,
          riskScore: j.risk_score,
          sentimentScore: j.sentiment_score,
          taskProgress: `${counts.completed}/${counts.total} (${progress}%)`,
          progressPercent: progress,
        }
      })

      const atRiskCount = team.filter((m: any) => m.riskScore > 50).length

      return {
        team,
        summary: `${team.length} team member(s). ${atRiskCount} at elevated risk.`,
      }
    },
  })
}
