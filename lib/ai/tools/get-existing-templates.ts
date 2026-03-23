import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getExistingTemplates() {
  return tool({
    description:
      'Get all existing journey templates so the AI can avoid creating duplicates and understand what already exists.',
    inputSchema: z.object({
      department: z
        .string()
        .optional()
        .describe('Filter templates by department'),
    }),
    execute: async ({ department }) => {
      const supabase = createSupabaseAdmin()

      let query = supabase
        .from('journey_templates')
        .select('id, name, description, role_type, department, duration_days, ai_generated')
        .order('created_at', { ascending: false })

      if (department) {
        query = query.eq('department', department)
      }

      const { data, error } = await query

      if (error) {
        return { error: `Failed to fetch templates: ${error.message}` }
      }

      return { templates: data ?? [] }
    },
  })
}
