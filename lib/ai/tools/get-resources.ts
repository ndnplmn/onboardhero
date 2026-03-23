import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getResources(defaultDepartment: string) {
  return tool({
    description:
      'Get onboarding resources such as documents, guides, and links. Optionally filter by department.',
    inputSchema: z.object({
      department: z
        .string()
        .optional()
        .describe('Filter resources by department. Defaults to the employee department.'),
    }),
    execute: async ({ department }) => {
      const supabase = createSupabaseAdmin()
      const dept = department ?? defaultDepartment

      let query = supabase
        .from('resources')
        .select('id, title, description, url, type, department')
        .order('title', { ascending: true })

      if (dept) {
        query = query.eq('department', dept)
      }

      const { data, error } = await query

      if (error) {
        return { error: `Failed to fetch resources: ${error.message}` }
      }

      return { resources: data ?? [] }
    },
  })
}
