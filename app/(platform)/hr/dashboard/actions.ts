'use server'

import { createSupabaseServer } from '@/lib/db/supabase-server'
import { logAction } from '@/lib/db/log-action'

export async function logHRInboxAction(
  journeyId: string,
  type: 'hr_intervention_acted' | 'hr_intervention_dismissed',
  hireName: string,
  riskScoreAtAction: number,
) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await logAction({
    journeyId,
    actorId:    user.id,
    actorRole:  'hr',
    actionType: type,
    label:      type === 'hr_intervention_acted'
      ? `HR acted on ${hireName} (risk ${riskScoreAtAction})`
      : `HR dismissed alert for ${hireName}`,
    metadata:   { riskScoreAtIntervention: riskScoreAtAction, hireName },
  })
}
