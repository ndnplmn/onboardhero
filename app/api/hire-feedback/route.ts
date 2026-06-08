import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { journeyId, content, feedbackType } = await req.json() as {
    journeyId: string
    content: string
    feedbackType: 'positive' | 'constructive'
  }

  if (!journeyId?.trim()) return Response.json({ error: 'journeyId is required' }, { status: 400 })
  if (!content?.trim())   return Response.json({ error: 'content is required' }, { status: 400 })
  if (feedbackType !== 'positive' && feedbackType !== 'constructive') {
    return Response.json({ error: 'Invalid feedbackType' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  await admin.from('manager_notes').insert({
    journey_id:  journeyId,
    manager_id:  user.id,
    content:     content.trim(),
    source:      feedbackType,
    created_at:  new Date().toISOString(),
  })

  return Response.json({ ok: true })
}
