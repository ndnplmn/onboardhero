import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getMyContacts(journeyId: string) {
  return tool({
    description:
      'Get the contact information for the manager assigned to this onboarding journey.',
    inputSchema: z.object({}),
    execute: async () => {
      const supabase = createSupabaseAdmin()

      // First get the journey to find the manager_id
      const { data: journey, error: journeyError } = await supabase
        .from('journeys')
        .select('manager_id')
        .eq('id', journeyId)
        .single()

      if (journeyError || !journey) {
        return { error: `Failed to fetch journey: ${journeyError?.message}` }
      }

      // Then get the manager's profile
      const { data: manager, error: managerError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department')
        .eq('id', journey.manager_id)
        .single()

      if (managerError || !manager) {
        return { error: `Failed to fetch manager profile: ${managerError?.message}` }
      }

      return {
        contacts: [
          {
            ...manager,
            relationship: 'Manager',
          },
        ],
      }
    },
  })
}
