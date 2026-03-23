import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getOrgResources() {
  return tool({
    description:
      'Get available organizational resources (documents, videos, links, contacts) that can be referenced in generated onboarding journeys.',
    inputSchema: z.object({
      department: z
        .string()
        .optional()
        .describe('Filter resources by department'),
    }),
    execute: async ({ department }) => {
      const supabase = createSupabaseAdmin()

      let query = supabase
        .from('resources')
        .select('id, title, type, url, department')
        .order('title', { ascending: true })

      if (department) {
        query = query.or(`department.eq.${department},department.is.null`)
      }

      const { data, error } = await query

      if (error) {
        return { error: `Failed to fetch resources: ${error.message}` }
      }

      return { resources: data ?? [] }
    },
  })
}
