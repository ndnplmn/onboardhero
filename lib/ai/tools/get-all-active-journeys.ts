import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getAllActiveJourneys() {
  return tool({
    description:
      'Get all active onboarding journeys across the organization with employee names, current week, risk scores, and sentiment scores.',
    inputSchema: z.object({}),
    execute: async () => {
      const supabase = createSupabaseAdmin()

      const { data: journeys, error } = await supabase
        .from('journeys')
        .select(
          'id, status, current_week, risk_score, risk_reasons, sentiment_score, start_date, employee:profiles!employee_id(id, full_name, email, department), manager:profiles!manager_id(id, full_name)'
        )
        .in('status', ['active', 'in_progress', 'at_risk'])
        .order('risk_score', { ascending: false })

      if (error) {
        return { error: `Failed to fetch journeys: ${error.message}` }
      }

      if (!journeys || journeys.length === 0) {
        return { journeys: [], summary: 'No active journeys found.' }
      }

      return {
        journeys: journeys.map((j: any) => ({
          journeyId: j.id,
          status: j.status,
          currentWeek: j.current_week,
          riskScore: j.risk_score ?? 0,
          riskReasons: j.risk_reasons ?? [],
          sentimentScore: j.sentiment_score,
          startDate: j.start_date,
          employee: {
            id: j.employee?.id,
            name: j.employee?.full_name || 'Unknown',
            email: j.employee?.email,
            department: j.employee?.department || 'General',
          },
          manager: {
            id: j.manager?.id,
            name: j.manager?.full_name || 'Unassigned',
          },
        })),
        total: journeys.length,
      }
    },
  })
}
