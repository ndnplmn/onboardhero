import { createSupabaseServer } from '@/lib/db/supabase-server'
import { logAction } from '@/lib/db/log-action'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { journeyId, rating, daysToFirstContribution, retention, notes } = await req.json()
  if (!journeyId || !rating || !retention) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  await logAction({
    journeyId,
    actorId:    user.id,
    actorRole:  'hire',
    actionType: 'check_in_completed',
    label:      `Journey outcome submitted — ${rating}/5 stars, retention: ${retention}`,
    metadata:   { rating, daysToFirstContribution, retention, notes: notes || null },
  })

  return Response.json({ ok: true })
}
