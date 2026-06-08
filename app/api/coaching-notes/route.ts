import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'
import { logAction } from '@/lib/db/log-action'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { note, source } = await req.json()
  if (!note?.trim()) return Response.json({ error: 'Note is required' }, { status: 400 })

  const admin = createSupabaseAdmin()

  await admin.from('coaching_notes').insert({
    manager_id: user.id,
    content:    note.trim(),
    source:     source ?? 'manual',
    created_at: new Date().toISOString(),
  })

  await logAction({
    journeyId:  `manager-${user.id}`,
    actorId:    user.id,
    actorRole:  'manager',
    actionType: 'ai_suggestion_accepted',
    label:      `Saved roleplay insight to coaching notes`,
  })

  return Response.json({ ok: true })
}
