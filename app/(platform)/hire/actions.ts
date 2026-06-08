'use server'

import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'
import { getUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/lib/db/log-action'

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  const supabase = await createSupabaseServer()

  await supabase
    .from('journey_tasks')
    .update({
      status:       completed ? 'completed' : 'pending',
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
      // Log the task completion
      const user = await getUser()
      await logAction({
        journeyId:  task.journey_id,
        actorId:    user.id,
        actorRole:  'hire',
        actionType: 'task_completed',
        label:      'You completed a task',
        metadata:   { taskId },
      })

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

        // Notify manager
        const { data: journey } = await supabase
          .from('journeys')
          .select('manager_id, employee:profiles!employee_id(full_name)')
          .eq('id', task.journey_id)
          .single()

        if (journey) {
          const employeeName = (journey as any).employee?.full_name || 'A team member'
          await supabase.from('notifications').insert({
            user_id: journey.manager_id,
            type:    'milestone',
            title:   'Journey Completed',
            message: `${employeeName} has completed their onboarding journey!`,
          })
        }
      }
    }
  }

  revalidatePath('/hire/dashboard')
  revalidatePath('/hire/tasks')
  revalidatePath('/hr/tasks')
  revalidatePath('/manager/dashboard')
}

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseServer()

  const id              = formData.get('id')              as string
  const fullName        = formData.get('full_name')       as string
  const phone           = formData.get('phone')           as string
  const bio             = formData.get('bio')             as string
  const ecName          = formData.get('ec_name')         as string
  const ecPhone         = formData.get('ec_phone')        as string
  const ecRelationship  = formData.get('ec_relationship') as string
  const interestsRaw    = formData.get('interests')       as string | null
  const funFact         = formData.get('fun_fact')        as string | null

  const emergencyContact = ecName
    ? { name: ecName, phone: ecPhone, relationship: ecRelationship }
    : {}

  const interestArray = interestsRaw
    ? interestsRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
    : []

  await supabase
    .from('profiles')
    .update({
      full_name:         fullName,
      phone:             phone || null,
      bio:               bio   || null,
      emergency_contact: emergencyContact,
      interests:         interestArray,
      fun_fact:          funFact || null,
    } as any)
    .eq('id', id)

  revalidatePath('/hire/profile')
  revalidatePath('/hire/dashboard')
  revalidatePath('/manager/profile')
  revalidatePath('/hr/profile')
}

export async function submitForm(formId: string, journeyId: string | null, answers: Record<string, string | boolean>) {
  const supabase = await createSupabaseServer()
  const user     = await getUser()

  // 1. Record the submission
  await supabase
    .from('form_submissions')
    .insert({
      form_id:     formId,
      employee_id: user.id,
      journey_id:  journeyId,
      answers,
    })

  // 2. Auto-complete matching journey task — find a pending task whose title
  //    shares keywords with the form title (case-insensitive overlap)
  if (journeyId) {
    const admin = createSupabaseAdmin()

    // Fetch the form title to extract keywords
    const { data: form } = await admin
      .from('onboarding_forms')
      .select('title')
      .eq('id', formId)
      .single()

    const formTitle = (form?.title ?? '').toLowerCase()
    // Extract meaningful words (skip stop words)
    const STOP = new Set(['a','an','the','and','or','of','to','in','for','on','with','your','my','our','by','at','from'])
    const keywords = formTitle.split(/[\s\-_,&]+/).filter((w: string) => w.length > 3 && !STOP.has(w))

    if (keywords.length > 0) {
      const { data: tasks } = await admin
        .from('journey_tasks')
        .select('id, title')
        .eq('journey_id', journeyId)
        .in('status', ['pending', 'in_progress'])
        .eq('assigned_to_role', 'new_hire')

      if (tasks?.length) {
        for (const task of tasks) {
          const taskLower = task.title.toLowerCase()
          const matches = keywords.filter((kw: string) => taskLower.includes(kw))
          // Require at least 2 keyword matches OR 1 strong match (word > 6 chars)
          const isMatch = matches.length >= 2 || matches.some((m: string) => m.length > 6)
          if (isMatch) {
            await admin
              .from('journey_tasks')
              .update({ status: 'completed', completed_at: new Date().toISOString() })
              .eq('id', task.id)

            await logAction({
              journeyId,
              actorId:    user.id,
              actorRole:  'hire',
              actionType: 'task_completed',
              label:      `Auto-completed task via form: "${task.title}"`,
              metadata:   { formId, taskId: task.id, source: 'form_submission' },
            })
            break // Only auto-complete one task per form submission
          }
        }
      }
    }
  }

  revalidatePath('/hire/forms')
  revalidatePath('/hire/dashboard')
}

export async function submitFeedback(journeyId: string, milestone: string, rating: number, comments: string) {
  const supabase = await createSupabaseServer()
  const user     = await getUser()

  await supabase
    .from('feedback_surveys')
    .insert({
      journey_id:  journeyId,
      employee_id: user.id,
      milestone,
      rating,
      comments: comments || null,
    })

  revalidatePath('/hire/dashboard')
}

export async function acceptAISuggestion(journeyId: string, taskTitle: string, reason: string) {
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
    journey_id:  journeyId,
    title:       taskTitle,
    description: reason || null,
    week,
    status:      'pending',
  })

  revalidatePath('/hire/dashboard')
  revalidatePath('/hire/tasks')
}

export async function reportFrictionPoint(
  journeyId: string,
  type: 'technical' | 'culture' | 'engagement' | 'role_clarity' | 'mentorship',
  description: string,
) {
  const supabase = await createSupabaseServer()
  const user     = await getUser()

  const { data: journey } = await supabase
    .from('journeys')
    .select('friction_points, manager_id, employee:profiles!employee_id(full_name)')
    .eq('id', journeyId)
    .single()

  if (!journey) return

  const current: any[] = Array.isArray(journey.friction_points) ? journey.friction_points : []
  const newPoint = {
    id:           `self-${Date.now()}`,
    type,
    severity:     'medium' as const,
    label:        description.slice(0, 60),
    description,
    day:          Math.max(0, Math.round((Date.now() - Date.now()) / 86400000)), // patched per journey below
    intervention: 'Self-reported by employee — manager review recommended.',
    source:       'self_reported',
  }

  // Calculate actual day number
  const { data: jFull } = await supabase.from('journeys').select('start_date').eq('id', journeyId).single()
  if (jFull?.start_date) {
    newPoint.day = Math.max(0, Math.round((Date.now() - new Date(jFull.start_date).getTime()) / 86400000))
  }

  await supabase.from('journeys').update({ friction_points: [...current, newPoint] }).eq('id', journeyId)

  // Notify manager
  const employeeName = (journey as any).employee?.full_name ?? 'Your hire'
  if (journey.manager_id) {
    await supabase.from('notifications').insert({
      user_id: journey.manager_id,
      type:    'risk_alert',
      title:   'Hire reported a blocker',
      message: `${employeeName} reported a ${type.replace('_', ' ')} blocker: "${description.slice(0, 80)}${description.length > 80 ? '…' : ''}"`,
    })
  }

  revalidatePath('/hire/dashboard')
}

export async function shareAchievement(journeyId: string, achievementLabel: string) {
  const supabase = await createSupabaseServer()

  const { data: journey } = await supabase
    .from('journeys')
    .select('manager_id, employee:profiles!employee_id(full_name)')
    .eq('id', journeyId)
    .single()

  if (!journey?.manager_id) return

  const employeeName = (journey as any).employee?.full_name ?? 'Your hire'
  await supabase.from('notifications').insert({
    user_id: journey.manager_id,
    type:    'milestone',
    title:   'Achievement unlocked',
    message: `${employeeName} just earned the "${achievementLabel}" badge on their onboarding journey!`,
  })
}

export async function resolveFrictionPoint(journeyId: string, pointId: string) {
  const supabase = await createSupabaseServer()
  const user = await getUser()

  const { data: journey } = await supabase
    .from('journeys')
    .select('friction_points, manager_id')
    .eq('id', journeyId)
    .single()

  if (!journey) return

  const current: any[] = Array.isArray(journey.friction_points) ? journey.friction_points : []
  const point = current.find((p: any) => p.id === pointId)
  const updated = current.map((p: any) =>
    p.id === pointId
      ? { ...p, status: 'resolved', resolvedAt: new Date().toISOString() }
      : p
  )

  await supabase.from('journeys').update({ friction_points: updated }).eq('id', journeyId)

  await logAction({
    journeyId,
    actorId:    user.id,
    actorRole:  'hire',
    actionType: 'friction_resolved',
    label:      `Marked concern as resolved: "${point?.label ?? 'Issue'}"`,
    metadata:   { pointId },
  })

  if (journey.manager_id) {
    await supabase.from('notifications').insert({
      user_id: journey.manager_id,
      type:    'milestone',
      title:   'Hire resolved a concern',
      message: `The hire marked "${point?.label ?? 'a friction point'}" as resolved.`,
    })
  }

  revalidatePath('/hire/dashboard')
  revalidatePath('/manager/dashboard')
}

export async function resolveHireFrictionPoint(journeyId: string, pointId: string, resolvedByName: string) {
  const supabase = await createSupabaseServer()
  const user = await getUser()

  const { data: journey } = await supabase
    .from('journeys')
    .select('friction_points, employee_id')
    .eq('id', journeyId)
    .single()

  if (!journey) return

  const current: any[] = Array.isArray(journey.friction_points) ? journey.friction_points : []
  const point = current.find((p: any) => p.id === pointId)
  const updated = current.map((p: any) =>
    p.id === pointId
      ? { ...p, status: 'resolved', resolvedBy: resolvedByName, resolvedAt: new Date().toISOString() }
      : p
  )

  await supabase.from('journeys').update({ friction_points: updated }).eq('id', journeyId)

  await logAction({
    journeyId,
    actorId:    user.id,
    actorRole:  'manager',
    actionType: 'friction_resolved',
    label:      `Manager addressed concern: "${point?.label ?? 'Issue'}"`,
    metadata:   { pointId, resolvedBy: resolvedByName },
  })

  if (journey.employee_id) {
    await supabase.from('notifications').insert({
      user_id: journey.employee_id,
      type:    'milestone',
      title:   'Your concern was addressed',
      message: `${resolvedByName} marked your concern about "${point?.label ?? 'an issue'}" as resolved.`,
      action_url: '/hire/dashboard',
    })
  }

  revalidatePath('/hire/dashboard')
  revalidatePath('/manager/dashboard')
}

export async function upsertGoal(
  journeyId: string,
  milestone: 'day_30' | 'day_60' | 'day_90',
  title: string,
  description?: string,
) {
  const supabase = await createSupabaseServer()
  const user     = await getUser()

  await supabase.from('journey_goals').insert({
    journey_id:  journeyId,
    milestone,
    title,
    description: description || null,
    created_by:  user.id,
  })

  await logAction({
    journeyId,
    actorId:    user.id,
    actorRole:  'hire',
    actionType: 'goal_added',
    label:      `Added a ${milestone.replace('_', '-')} goal`,
    metadata:   { milestone, title },
  })

  revalidatePath('/hire/dashboard')
  revalidatePath('/manager/dashboard')
}

export async function updateGoalStatus(goalId: string, status: 'not_started' | 'in_progress' | 'completed') {
  const supabase = await createSupabaseServer()

  await supabase
    .from('journey_goals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', goalId)

  if (status === 'completed') {
    const { data: goal } = await supabase
      .from('journey_goals')
      .select('journey_id, milestone, title')
      .eq('id', goalId)
      .single()

    if (goal) {
      const user = await getUser()
      await logAction({
        journeyId:  goal.journey_id,
        actorId:    user.id,
        actorRole:  'hire',
        actionType: 'goal_added',
        label:      `Goal completed: ${goal.title}`,
        metadata:   { goalId, milestone: goal.milestone },
      })

      const { data: journey } = await supabase
        .from('journeys')
        .select('manager_id, employee:profiles!employee_id(full_name)')
        .eq('id', goal.journey_id)
        .single()

      const milestoneLabel = goal.milestone === '30' ? '30-Day' : goal.milestone === '60' ? '60-Day' : '90-Day'
      if ((journey as any)?.manager_id) {
        await supabase.from('notifications').insert({
          user_id:    (journey as any).manager_id,
          type:       'milestone',
          title:      `${(journey as any).employee?.full_name ?? 'Your hire'} hit a milestone`,
          message:    `${milestoneLabel} goal completed: "${goal.title}"`,
          action_url: `/manager/team/${goal.journey_id}`,
        })
      }
    }
  }

  revalidatePath('/hire/dashboard')
  revalidatePath('/manager/dashboard')
}

export async function deleteGoal(goalId: string) {
  const supabase = await createSupabaseServer()
  await supabase.from('journey_goals').delete().eq('id', goalId)
  revalidatePath('/hire/dashboard')
  revalidatePath('/manager/dashboard')
}

export async function getUnlockedAchievements(journeyId: string): Promise<string[]> {
  const admin = createSupabaseAdmin()
  const { data } = await admin
    .from('action_log')
    .select('metadata')
    .eq('journey_id', journeyId)
    .eq('action_type', 'achievement_unlocked')
  return (data ?? []).map((row: any) => row.metadata?.achievementId as string).filter(Boolean)
}

export async function unlockAchievement(journeyId: string, achievementId: string, label: string): Promise<void> {
  const user  = await getUser()
  const admin = createSupabaseAdmin()
  // Idempotent — only insert if not already logged
  const { data: existing } = await admin
    .from('action_log')
    .select('id')
    .eq('journey_id', journeyId)
    .eq('action_type', 'achievement_unlocked')
    .eq('metadata->>achievementId', achievementId)
    .limit(1)
  if (existing?.length) return
  await admin.from('action_log').insert({
    journey_id:  journeyId,
    actor_id:    user.id,
    actor_role:  'hire',
    action_type: 'achievement_unlocked',
    label:       `Achievement unlocked: ${label}`,
    metadata:    { achievementId, label },
  })
}

export async function markResourceRead(resourceId: string, userId: string) {
  const supabase = await createSupabaseServer()

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
