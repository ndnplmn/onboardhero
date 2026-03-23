import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getOrgContext() {
  return tool({
    description:
      'Get an overview of existing organizational resources and journey templates to understand what content already exists and avoid duplication.',
    inputSchema: z.object({}),
    execute: async () => {
      const supabase = createSupabaseAdmin()

      const [resourcesResult, templatesResult] = await Promise.all([
        supabase
          .from('resources')
          .select('title, type, department')
          .order('title', { ascending: true }),
        supabase
          .from('journey_templates')
          .select('name, department')
          .order('name', { ascending: true }),
      ])

      if (resourcesResult.error) {
        return { error: `Failed to fetch resources: ${resourcesResult.error.message}` }
      }

      if (templatesResult.error) {
        return { error: `Failed to fetch templates: ${templatesResult.error.message}` }
      }

      return {
        resources: resourcesResult.data ?? [],
        templates: templatesResult.data ?? [],
      }
    },
  })
}
