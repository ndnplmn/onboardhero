import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'
import { logAction } from '@/lib/db/log-action'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createSupabaseAdmin()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'manager') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { scenarioTitle, difficulty } = await req.json()

  // Use a sentinel journeyId for manager-level actions (no specific journey)
  await logAction({
    journeyId:  `manager-${user.id}`,
    actorId:    user.id,
    actorRole:  'manager',
    actionType: 'roleplay_completed',
    label:      `Completed roleplay: ${scenarioTitle ?? 'Unknown scenario'} (${difficulty ?? ''})`,
  })

  // Fetch updated count for this manager
  const { count } = await admin
    .from('action_log')
    .select('id', { count: 'exact', head: true })
    .eq('actor_id', user.id)
    .eq('action_type', 'roleplay_completed')

  return Response.json({ ok: true, count: count ?? 0 })
}
