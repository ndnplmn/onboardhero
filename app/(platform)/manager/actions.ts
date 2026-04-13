'use server'

import { createSupabaseServer } from '@/lib/db/supabase-server'
import { getUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function toggleManagerTask(taskId: string, completed: boolean) {
  await getUser()
  const supabase = await createSupabaseServer()

  await supabase
    .from('journey_tasks')
    .update({
      status:       completed ? 'completed' : 'pending',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)

  revalidatePath('/manager/tasks')
  revalidatePath('/manager/team')
  revalidatePath('/manager/dashboard')
}

export async function completeCheckIn(checkInId: string) {
  const user = await getUser()
  const supabase = await createSupabaseServer()

  await supabase
    .from('check_ins')
    .update({ completed_date: new Date().toISOString().split('T')[0] })
    .eq('id', checkInId)
    .eq('manager_id', user.id)

  revalidatePath('/manager/team')
  revalidatePath('/manager/dashboard')
  revalidatePath('/manager/tasks')
}

export async function addTaskNote(taskId: string, notes: string) {
  await getUser()
  const supabase = await createSupabaseServer()

  await supabase
    .from('journey_tasks')
    .update({ notes })
    .eq('id', taskId)

  revalidatePath('/manager/team')
  revalidatePath('/manager/tasks')
}

export async function approveTask(taskId: string) {
  const user = await getUser()
  const supabase = await createSupabaseServer()

  await supabase
    .from('journey_tasks')
    .update({
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  revalidatePath('/manager/team')
  revalidatePath('/manager/tasks')
}

export async function rescheduleCheckIn(checkInId: string, newDate: string) {
  const user = await getUser()
  const supabase = await createSupabaseServer()

  await supabase
    .from('check_ins')
    .update({ scheduled_date: newDate })
    .eq('id', checkInId)
    .eq('manager_id', user.id)

  revalidatePath('/manager/team')
  revalidatePath('/manager/dashboard')
  revalidatePath('/manager/tasks')
}
