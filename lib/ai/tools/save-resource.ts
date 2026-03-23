import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function saveResource() {
  return tool({
    description:
      'Save AI-generated content as a resource in the organization library. Call this only when the user explicitly confirms they want to save the content.',
    inputSchema: z.object({
      title: z.string().describe('Resource title, e.g. "Engineering Onboarding Guide"'),
      type: z
        .enum(['document'])
        .describe('Resource type — currently only document is supported for AI-generated content'),
      content: z.string().describe('The full content in Markdown format'),
      department: z
        .string()
        .optional()
        .describe('Department this resource belongs to, if applicable'),
    }),
    execute: async ({ title, type, content, department }) => {
      const supabase = createSupabaseAdmin()

      const { data, error } = await supabase
        .from('resources')
        .insert({
          title,
          type,
          content,
          department: department ?? null,
          ai_generated: true,
        })
        .select()
        .single()

      if (error) {
        return { error: `Failed to save resource: ${error.message}` }
      }

      return {
        success: true,
        resourceId: data.id,
        message: `Resource "${title}" saved successfully.`,
      }
    },
  })
}
