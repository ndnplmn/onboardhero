import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getTemplateContext() {
  return tool({
    description:
      'Get details of a specific journey template and its tasks. Useful for generating content that references or complements an existing onboarding journey.',
    inputSchema: z.object({
      templateId: z.string().describe('The ID of the journey template to fetch'),
    }),
    execute: async ({ templateId }) => {
      const supabase = createSupabaseAdmin()

      const [templateResult, tasksResult] = await Promise.all([
        supabase
          .from('journey_templates')
          .select('id, name, description, role_type, department, duration_days')
          .eq('id', templateId)
          .single(),
        supabase
          .from('template_tasks')
          .select('title, description, week, assigned_to_role, order')
          .eq('template_id', templateId)
          .order('week', { ascending: true })
          .order('order', { ascending: true }),
      ])

      if (templateResult.error) {
        return { error: `Failed to fetch template: ${templateResult.error.message}` }
      }

      if (tasksResult.error) {
        return { error: `Failed to fetch tasks: ${tasksResult.error.message}` }
      }

      return {
        template: templateResult.data,
        tasks: tasksResult.data ?? [],
      }
    },
  })
}
