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

  const { error } = await supabase
    .from('journey_tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Task complete error:', error)
    return Response.json({ error: 'Failed to update task' }, { status: 500 })
  }

  return Response.json({ success: true })
}
