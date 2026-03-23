import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function updateRiskScore() {
  return tool({
    description:
      'Update the risk score and risk reasons for a specific journey. Score should be 0-100 where higher means more at risk.',
    inputSchema: z.object({
      journeyId: z.string().describe('The journey ID to update'),
      score: z.number().min(0).max(100).describe('Risk score from 0 (no risk) to 100 (critical risk)'),
      reasons: z
        .array(z.string())
        .describe('List of specific reasons for the risk score'),
    }),
    execute: async ({ journeyId, score, reasons }) => {
      const supabase = createSupabaseAdmin()

      const status = score > 70 ? 'at_risk' : 'active'

      const { error } = await supabase
        .from('journeys')
        .update({
          risk_score: score,
          risk_reasons: reasons,
          status,
        })
        .eq('id', journeyId)

      if (error) {
        return { error: `Failed to update risk score: ${error.message}` }
      }

      return {
        journeyId,
        updatedScore: score,
        updatedReasons: reasons,
        updatedStatus: status,
        message: `Risk score updated to ${score} for journey ${journeyId}.`,
      }
    },
  })
}
