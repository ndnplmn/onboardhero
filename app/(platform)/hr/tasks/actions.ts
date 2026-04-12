'use server'

import { createSupabaseServer } from '@/lib/db/supabase-server'
import { revalidatePath } from 'next/cache'

// ── Toggle a single task status ───────────────────────────────────────────

export async function toggleHRTask(taskId: string, completed: boolean) {
  const supabase = await createSupabaseServer()

  await supabase
    .from('journey_tasks')
    .update({
      status: completed ? 'completed' : 'pending',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)

  revalidatePath('/hr/tasks')
  revalidatePath('/hire/dashboard')
  revalidatePath('/manager/dashboard')
}

// ── Bulk mark tasks complete ───────────────────────────────────────────────

export async function bulkCompleteTasks(taskIds: string[]) {
  if (taskIds.length === 0) return
  const supabase = await createSupabaseServer()

  await supabase
    .from('journey_tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .in('id', taskIds)

  revalidatePath('/hr/tasks')
  revalidatePath('/hire/dashboard')
  revalidatePath('/manager/dashboard')
}

// ── Create a new task on an existing journey ──────────────────────────────

export async function createHRTask(formData: FormData) {
  const supabase = await createSupabaseServer()

  const journeyId      = formData.get('journey_id') as string
  const title          = formData.get('title') as string
  const description    = formData.get('description') as string
  const week           = parseInt(formData.get('week') as string) || 1
  const assignedToRole = formData.get('assigned_to_role') as string || 'new_hire'

  if (!journeyId || !title) return { error: 'Journey and title are required' }

  // Get current max order for that week
  const { data: existing } = await supabase
    .from('journey_tasks')
    .select('order')
    .eq('journey_id', journeyId)
    .eq('week', week)
    .order('order', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? (existing[0].order + 1) : 0

  const { error } = await supabase
    .from('journey_tasks')
    .insert({
      journey_id: journeyId,
      title,
      description: description || '',
      week,
      assigned_to_role: assignedToRole,
      status: 'pending',
      order: nextOrder,
    })

  if (error) return { error: error.message }

  revalidatePath('/hr/tasks')
  revalidatePath('/hire/dashboard')
  return { success: true }
}

// ── Reassign task to different role ──────────────────────────────────────

export async function reassignTaskRole(taskId: string, newRole: string) {
  const supabase = await createSupabaseServer()

  await supabase
    .from('journey_tasks')
    .update({ assigned_to_role: newRole })
    .eq('id', taskId)

  revalidatePath('/hr/tasks')
}

// ── Fetch all tasks with full employee context (for client rendering) ─────

export async function getHRTasksWithContext() {
  const supabase = await createSupabaseServer()

  const { data: tasks } = await supabase
    .from('journey_tasks')
    .select(`
      id, title, description, week, status, assigned_to_role, completed_at, order,
      journey:journeys!journey_id(
        id, current_week, start_date,
        employee:profiles!employee_id(id, full_name, department, avatar_url)
      )
    `)
    .order('week', { ascending: true })

  const { data: journeys } = await supabase
    .from('journeys')
    .select('id, employee:profiles!employee_id(id, full_name, department)')
    .eq('status', 'active')

  return {
    tasks: tasks || [],
    journeys: journeys || [],
  }
}
