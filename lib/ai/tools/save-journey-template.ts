import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function saveJourneyTemplate(createdBy: string) {
  return tool({
    description:
      'Save an AI-generated journey template to the database. Call this when the HR user confirms they want to save the generated journey.',
    inputSchema: z.object({
      name: z.string().describe('Template name, e.g. "Frontend Developer Onboarding"'),
      description: z.string().describe('Brief description of this journey template'),
      role_type: z.string().describe('The role type, e.g. "Engineering", "Design", "Sales"'),
      department: z.string().describe('Department name'),
      duration_days: z.number().describe('Duration in days, typically 90'),
      tasks: z.array(
        z.object({
          title: z.string().describe('Task title'),
          description: z.string().describe('Task description'),
          week: z.number().describe('Week number (1-12)'),
          assigned_to_role: z
            .enum(['new_hire', 'manager', 'hr'])
            .describe('Who is responsible for this task'),
          order: z.number().describe('Order within the week'),
        })
      ).describe('Array of tasks organized by week'),
    }),
    execute: async ({ name, description, role_type, department, duration_days, tasks }) => {
      const supabase = createSupabaseAdmin()

      const { data: template, error: templateError } = await supabase
        .from('journey_templates')
        .insert({
          name,
          description,
          role_type,
          department,
          duration_days,
          ai_generated: true,
          created_by: createdBy,
        })
        .select()
        .single()

      if (templateError) {
        return { error: `Failed to create template: ${templateError.message}` }
      }

      const taskRows = tasks.map((t) => ({
        template_id: template.id,
        title: t.title,
        description: t.description,
        week: t.week,
        assigned_to_role: t.assigned_to_role,
        order: t.order,
      }))

      const { error: tasksError } = await supabase.from('template_tasks').insert(taskRows)

      if (tasksError) {
        // Clean up orphaned template
        await supabase.from('journey_templates').delete().eq('id', template.id)
        return { error: `Failed to save journey tasks: ${tasksError.message}` }
      }

      return {
        success: true,
        templateId: template.id,
        message: `Template "${name}" saved with ${tasks.length} tasks.`,
      }
    },
  })
}
