'use server'

import { createSupabaseServer } from '@/lib/db/supabase-server'
import { getUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/lib/db/log-action'

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

export async function completeCheckIn(checkInId: string, notes?: string) {
  const user = await getUser()
  const supabase = await createSupabaseServer()

  const { data: checkIn } = await supabase
    .from('check_ins')
    .select('journey_id')
    .eq('id', checkInId)
    .single()

  const updatePayload: Record<string, string> = {
    completed_date: new Date().toISOString().split('T')[0],
  }
  if (notes?.trim()) updatePayload.manager_notes = notes.trim().slice(0, 2000)

  await supabase
    .from('check_ins')
    .update(updatePayload)
    .eq('id', checkInId)
    .eq('manager_id', user.id)

  if (checkIn?.journey_id) {
    await logAction({
      journeyId:  checkIn.journey_id,
      actorId:    user.id,
      actorRole:  'manager',
      actionType: 'check_in_completed',
      label:      'Your manager completed a check-in',
    })
  }

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

export async function applyAISuggestion(journeyId: string, taskTitle: string, reason: string) {
  const user = await getUser()
  const supabase = await createSupabaseServer()

  const { data: lastTask } = await supabase
    .from('journey_tasks')
    .select('week')
    .eq('journey_id', journeyId)
    .order('week', { ascending: false })
    .limit(1)
    .single()

  const week = lastTask?.week ?? 1

  await supabase.from('journey_tasks').insert({
    journey_id:       journeyId,
    title:            taskTitle,
    description:      reason || null,
    week,
    status:           'pending',
    assigned_to_role: 'new_hire',
  })

  await logAction({
    journeyId,
    actorId:    user.id,
    actorRole:  'manager',
    actionType: 'ai_suggestion_accepted',
    label:      'Your manager added an AI-recommended task',
    metadata:   { taskTitle },
  })

  revalidatePath('/manager/dashboard')
  revalidatePath('/hire/dashboard')
  revalidatePath('/hire/tasks')
}

export async function rescheduleCheckIn(checkInId: string, newDate: string) {
  const user = await getUser()
  const supabase = await createSupabaseServer()

  const { data: checkIn } = await supabase
    .from('check_ins')
    .select('journey_id')
    .eq('id', checkInId)
    .single()

  await supabase
    .from('check_ins')
    .update({ scheduled_date: newDate })
    .eq('id', checkInId)
    .eq('manager_id', user.id)

  if (checkIn?.journey_id) {
    await logAction({
      journeyId:  checkIn.journey_id,
      actorId:    user.id,
      actorRole:  'manager',
      actionType: 'check_in_scheduled',
      label:      'Your manager rescheduled a check-in',
      metadata:   { newDate },
    })
  }

  revalidatePath('/manager/team')
  revalidatePath('/manager/dashboard')
  revalidatePath('/manager/tasks')
}

export async function saveManagerNote(journeyId: string, content: string): Promise<{ savedAt: string }> {
  const user     = await getUser()
  const supabase = await createSupabaseServer()
  const now      = new Date().toISOString()

  await supabase.from('manager_notes').upsert(
    { journey_id: journeyId, manager_id: user.id, content, updated_at: now },
    { onConflict: 'journey_id,manager_id' }
  )

  return { savedAt: now }
}

export async function getManagerNote(journeyId: string): Promise<string> {
  const user     = await getUser()
  const supabase = await createSupabaseServer()

  const { data } = await supabase
    .from('manager_notes')
    .select('content')
    .eq('journey_id', journeyId)
    .eq('manager_id', user.id)
    .single()

  return (data as any)?.content ?? ''
}
