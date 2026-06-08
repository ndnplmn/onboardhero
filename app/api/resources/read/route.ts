import { NextRequest } from 'next/server'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { resourceId } = await req.json() as { resourceId: string }
  if (!resourceId) return Response.json({ error: 'resourceId required' }, { status: 400 })

  const admin = createSupabaseAdmin()

  // Fetch current read_by array and append if not already present
  const { data } = await admin
    .from('resources')
    .select('read_by')
    .eq('id', resourceId)
    .single()

  const existing: string[] = (data?.read_by as string[] | null) ?? []
  if (!existing.includes(user.id)) {
    await admin
      .from('resources')
      .update({ read_by: [...existing, user.id] })
      .eq('id', resourceId)
  }

  return Response.json({ ok: true })
}
