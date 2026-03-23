import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getMyJourney(journeyId: string) {
  return tool({
    description:
      'Get the current onboarding journey details including progress, current week, start date, and status.',
    inputSchema: z.object({}),
    execute: async () => {
      const supabase = createSupabaseAdmin()

      const { data, error } = await supabase
        .from('journeys')
        .select('id, status, current_week, start_date, progress, department, role')
        .eq('id', journeyId)
        .single()

      if (error) {
        return { error: `Failed to fetch journey: ${error.message}` }
      }

      return { journey: data }
    },
  })
}
