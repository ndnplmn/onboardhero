'use server'

import { createSupabaseServer } from '@/lib/db/supabase-server'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/get-user'

// ── Template CRUD ──────────────────────────────────────────────────────────

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
    .insert({ name, description, role_type: roleType, department, created_by: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  if (tasksJson) {
    const tasks = JSON.parse(tasksJson) as Array<{ title: string; description: string; week: number; assigned_to_role: string; order: number }>
    await supabase.from('template_tasks').insert(
      tasks.map(t => ({
        template_id: template.id,
        title: t.title,
        description: t.description || '',
        week: t.week,
        assigned_to_role: t.assigned_to_role || 'new_hire',
        order: t.order || 0,
      }))
    )
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

  const { data: original } = await supabase.from('journey_templates').select('*').eq('id', templateId).single()
  if (!original) return { error: 'Template not found' }

  const { data: originalTasks } = await supabase.from('template_tasks').select('*').eq('template_id', templateId).order('week').order('order')

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
    await supabase.from('template_tasks').insert(
      originalTasks.map((t: any) => ({
        template_id: newTemplate.id,
        title: t.title,
        description: t.description,
        week: t.week,
        assigned_to_role: t.assigned_to_role,
        order: t.order,
      }))
    )
  }

  revalidatePath('/hr/journeys')
  return { success: true }
}

// ── Assign journey to a hire ───────────────────────────────────────────────

export async function assignJourneyToEmployee(templateId: string, employeeId: string, managerId: string) {
  const supabase = await createSupabaseServer()

  const { error } = await supabase.rpc('create_journey_from_template', {
    p_employee_id: employeeId,
    p_template_id: templateId,
    p_manager_id: managerId,
  })

  if (error) return { error: error.message }
  revalidatePath('/hr/employees')
  revalidatePath('/hr/journeys')
  revalidatePath('/manager/dashboard')
  return { success: true }
}

// ── Seed one of the built-in starter templates ─────────────────────────────

const STARTER_DEFINITIONS: Record<string, {
  name: string; role_type: string; department: string; description: string; duration_days: number;
  tasks: { title: string; week: number; assigned_to_role: string }[]
}> = {
  standard: {
    name: '90-Day Standard',
    role_type: 'General',
    department: 'All Departments',
    description: 'Universal onboarding journey covering culture, tools, and first deliverables.',
    duration_days: 90,
    tasks: [
      { title: 'Complete IT setup checklist', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Meet your buddy', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Review company handbook', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Set up benefits enrollment', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Week 1 check-in with manager', week: 1, assigned_to_role: 'manager' },
      { title: 'First project kickoff', week: 3, assigned_to_role: 'manager' },
      { title: '30-day HR review', week: 4, assigned_to_role: 'hr' },
      { title: '60-day performance review', week: 8, assigned_to_role: 'manager' },
      { title: '90-day completion review', week: 12, assigned_to_role: 'hr' },
    ],
  },
  engineering: {
    name: 'Engineering Fast-Track',
    role_type: 'Engineer',
    department: 'Engineering',
    description: 'Accelerated technical ramp-up for software engineers with early code contributions.',
    duration_days: 90,
    tasks: [
      { title: 'Dev environment setup', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Codebase walkthrough with buddy', week: 1, assigned_to_role: 'new_hire' },
      { title: 'First PR reviewed & merged', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Architecture deep-dive session', week: 2, assigned_to_role: 'manager' },
      { title: 'Own first ticket end-to-end', week: 3, assigned_to_role: 'new_hire' },
      { title: 'Code review standards training', week: 2, assigned_to_role: 'new_hire' },
      { title: '30-day technical assessment', week: 4, assigned_to_role: 'manager' },
      { title: 'Lead a sprint planning session', week: 8, assigned_to_role: 'new_hire' },
      { title: '90-day engineering review', week: 12, assigned_to_role: 'hr' },
    ],
  },
  sales: {
    name: 'Sales Enablement',
    role_type: 'Sales',
    department: 'Sales',
    description: 'Sales onboarding focused on product mastery, pitch certification, and first deals.',
    duration_days: 90,
    tasks: [
      { title: 'CRM setup and training', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Product demo certification', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Shadow 3 customer calls', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Pitch deck review with manager', week: 2, assigned_to_role: 'manager' },
      { title: 'First solo prospect call', week: 4, assigned_to_role: 'new_hire' },
      { title: 'Competitive landscape training', week: 3, assigned_to_role: 'new_hire' },
      { title: '30-day quota plan sign-off', week: 4, assigned_to_role: 'manager' },
      { title: 'Close first deal', week: 10, assigned_to_role: 'new_hire' },
      { title: '90-day sales review', week: 12, assigned_to_role: 'hr' },
    ],
  },
}

export async function seedStarterTemplate(key: string) {
  const supabase = await createSupabaseServer()
  const user = await getUser()
  const def = STARTER_DEFINITIONS[key]
  if (!def) return { error: 'Unknown starter template' }

  const { data: template, error } = await supabase
    .from('journey_templates')
    .insert({
      name: def.name,
      description: def.description,
      role_type: def.role_type,
      department: def.department,
      duration_days: def.duration_days,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('template_tasks').insert(
    def.tasks.map((t, i) => ({
      template_id: template.id,
      title: t.title,
      description: '',
      week: t.week,
      assigned_to_role: t.assigned_to_role,
      order: i,
    }))
  )

  revalidatePath('/hr/journeys')
  return { success: true, templateId: template.id }
}

// ── Data fetchers for assign modal ────────────────────────────────────────

export async function getAvailableHires(): Promise<{ id: string; full_name: string; department: string }[]> {
  const supabase = await createSupabaseServer()
  const { data: hires } = await supabase
    .from('profiles')
    .select('id, full_name, department')
    .eq('role', 'new_hire')
    .eq('active', true)

  const { data: journeys } = await supabase
    .from('journeys')
    .select('employee_id')
    .eq('status', 'active')

  const assignedIds = new Set((journeys || []).map((j: any) => j.employee_id))
  return (hires || []).filter((h: any) => !assignedIds.has(h.id))
}

export async function getManagersList(): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'manager')
    .eq('active', true)
  return (data || []) as { id: string; full_name: string }[]
}

export async function getTemplatesWithTasks() {
  const supabase = await createSupabaseServer()
  const { data: templates } = await supabase
    .from('journey_templates')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: tasks } = await supabase
    .from('template_tasks')
    .select('*')
    .order('week')
    .order('order')

  const tasksByTemplate: Record<string, any[]> = {}
  ;(tasks || []).forEach((t: any) => {
    if (!tasksByTemplate[t.template_id]) tasksByTemplate[t.template_id] = []
    tasksByTemplate[t.template_id].push(t)
  })

  return { templates: templates || [], tasksByTemplate }
}
