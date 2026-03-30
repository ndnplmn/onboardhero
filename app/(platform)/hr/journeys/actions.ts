'use server'

import { createSupabaseServer } from '@/lib/db/supabase-server'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/get-user'

export async function createTemplate(formData: FormData) {
  const supabase = await createSupabaseServer()
  const user = await getUser()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const roleType = formData.get('role_type') as string
  const department = formData.get('department') as string
  const tasksJson = formData.get('tasks') as string

  const { data: template, error } = await supabase
    .from('journey_templates')
    .insert({
      name,
      description,
      role_type: roleType,
      department,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Insert tasks
  if (tasksJson) {
    const tasks = JSON.parse(tasksJson) as Array<{ title: string; description: string; week: number; assigned_to_role: string; order: number }>
    const taskRows = tasks.map((t) => ({
      template_id: template.id,
      title: t.title,
      description: t.description || '',
      week: t.week,
      assigned_to_role: t.assigned_to_role || 'new_hire',
      order: t.order || 0,
    }))

    await supabase.from('template_tasks').insert(taskRows)
  }

  revalidatePath('/hr/journeys')
  return { success: true, templateId: template.id }
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createSupabaseServer()
  await supabase.from('journey_templates').delete().eq('id', templateId)
  revalidatePath('/hr/journeys')
}

export async function cloneTemplate(templateId: string) {
  const supabase = await createSupabaseServer()
  const user = await getUser()

  const { data: original } = await supabase
    .from('journey_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (!original) return { error: 'Template not found' }

  const { data: originalTasks } = await supabase
    .from('template_tasks')
    .select('*')
    .eq('template_id', templateId)
    .order('week')
    .order('order')

  const { data: newTemplate, error } = await supabase
    .from('journey_templates')
    .insert({
      name: `${original.name} (Copy)`,
      description: original.description,
      role_type: original.role_type,
      department: original.department,
      duration_days: original.duration_days,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  if (originalTasks && originalTasks.length > 0) {
    const taskRows = originalTasks.map((t: any) => ({
      template_id: newTemplate.id,
      title: t.title,
      description: t.description,
      week: t.week,
      assigned_to_role: t.assigned_to_role,
      order: t.order,
    }))
    await supabase.from('template_tasks').insert(taskRows)
  }

  revalidatePath('/hr/journeys')
  return { success: true }
}
