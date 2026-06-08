import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export type ActionType =
  | 'task_completed'
  | 'task_uncompleted'
  | 'goal_added'
  | 'goal_status_changed'
  | 'friction_reported'
  | 'friction_resolved'
  | 'check_in_completed'
  | 'check_in_scheduled'
  | 'progress_reviewed'
  | 'nudge_sent'
  | 'ai_suggestion_accepted'
  | 'roleplay_completed'
  | 'achievement_unlocked'
  | 'hr_intervention_acted'
  | 'hr_intervention_dismissed'
  | 'proactive_push'

export interface LogActionParams {
  journeyId:  string
  actorId?:   string
  actorRole:  'hire' | 'manager' | 'hr' | 'system'
  actionType: ActionType
  label:      string
  metadata?:  Record<string, unknown>
}

export async function logAction(params: LogActionParams): Promise<void> {
  const admin = createSupabaseAdmin()
  await admin.from('action_log').insert({
    journey_id:  params.journeyId,
    actor_id:    params.actorId ?? null,
    actor_role:  params.actorRole,
    action_type: params.actionType,
    label:       params.label,
    metadata:    params.metadata ?? null,
  })
}
