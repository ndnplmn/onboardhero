import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Managers use admin client (RLS would block cross-user writes)
  const { createSupabaseAdmin } = await import('@/lib/db/supabase-server')
  const admin = createSupabaseAdmin()

  const { error } = await admin
    .from('journey_tasks')
    .update({ status: 'in_progress' })
    .eq('id', id)

  if (error) {
    console.error('prioritize error:', error)
    return Response.json({ error: 'Failed to prioritize task' }, { status: 500 })
  }

  return Response.json({ success: true })
}
