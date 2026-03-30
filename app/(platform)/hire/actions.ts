'use server'

import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { getUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  const supabase = createSupabaseAdmin()

  await supabase
    .from('journey_tasks')
    .update({
      status: completed ? 'completed' : 'pending',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)

  // Check if all tasks in the journey are now completed
  if (completed) {
    const { data: task } = await supabase
      .from('journey_tasks')
      .select('journey_id')
      .eq('id', taskId)
      .single()

    if (task) {
      const { data: allTasks } = await supabase
        .from('journey_tasks')
        .select('status')
        .eq('journey_id', task.journey_id)

      const allCompleted = allTasks?.every((t: any) => t.status === 'completed')
      if (allCompleted) {
        await supabase
          .from('journeys')
          .update({ status: 'completed' })
          .eq('id', task.journey_id)

        // Notify manager and HR
        const { data: journey } = await supabase
          .from('journeys')
          .select('manager_id, employee:profiles!employee_id(full_name)')
          .eq('id', task.journey_id)
          .single()

        if (journey) {
          const employeeName = (journey as any).employee?.full_name || 'An employee'
          const { data: hrUsers } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'hr')

          const notifs = [
            {
              user_id: journey.manager_id,
              type: 'milestone' as const,
              title: 'Journey Completed',
              message: `${employeeName} has completed their onboarding journey!`,
            },
            ...(hrUsers || []).map((hr: any) => ({
              user_id: hr.id,
              type: 'milestone' as const,
              title: 'Journey Completed',
              message: `${employeeName} has completed their onboarding journey!`,
            })),
          ]

          await supabase.from('notifications').insert(notifs)
        }
      }
    }
  }

  revalidatePath('/hire/dashboard')
  revalidatePath('/hire/tasks')
}

export async function updateProfile(formData: FormData) {
  const supabase = createSupabaseAdmin()

  const id = formData.get('id') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const bio = formData.get('bio') as string
  const ecName = formData.get('ec_name') as string
  const ecPhone = formData.get('ec_phone') as string
  const ecRelationship = formData.get('ec_relationship') as string

  const emergencyContact = ecName ? { name: ecName, phone: ecPhone, relationship: ecRelationship } : {}

  await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      phone: phone || null,
      bio: bio || null,
      emergency_contact: emergencyContact,
    })
    .eq('id', id)

  revalidatePath('/hire/profile')
  revalidatePath('/hire/dashboard')
}

export async function submitForm(formId: string, journeyId: string | null, answers: Record<string, string | boolean>) {
  const supabase = createSupabaseAdmin()
  const user = await getUser()

  await supabase
    .from('form_submissions')
    .insert({
      form_id: formId,
      employee_id: user.id,
      journey_id: journeyId,
      answers,
    })

  revalidatePath('/hire/forms')
}

export async function submitFeedback(journeyId: string, milestone: string, rating: number, comments: string) {
  const supabase = createSupabaseAdmin()
  const user = await getUser()

  await supabase
    .from('feedback_surveys')
    .insert({
      journey_id: journeyId,
      employee_id: user.id,
      milestone,
      rating,
      comments: comments || null,
    })

  revalidatePath('/hire/dashboard')
}

export async function markResourceRead(resourceId: string, userId: string) {
  const supabase = createSupabaseAdmin()

  const { data: resource } = await supabase
    .from('resources')
    .select('read_by')
    .eq('id', resourceId)
    .single()

  const currentReadBy: string[] = resource?.read_by || []
  if (!currentReadBy.includes(userId)) {
    await supabase
      .from('resources')
      .update({ read_by: [...currentReadBy, userId] })
      .eq('id', resourceId)
  }

  revalidatePath('/hire/resources')
}
