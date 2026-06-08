import { NextRequest } from 'next/server'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: journeyId } = await params
  const body = await req.json()
  const { title, description, week } = body as {
    title: string
    description?: string
    week?: number
  }

  if (!title) {
    return Response.json({ error: 'title is required' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  // Verify the manager owns this journey
  const { data: journey } = await admin
    .from('journeys')
    .select('id, manager_id, current_week')
    .eq('id', journeyId)
    .single()

  if (!journey || journey.manager_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: task, error } = await admin.from('journey_tasks').insert({
    journey_id: journeyId,
    title,
    description: description ?? title,
    week: week ?? journey.current_week ?? 1,
    status: 'pending',
    assigned_to_role: 'new_hire',
  }).select().single()

  if (error) {
    console.error('Task create error:', error)
    return Response.json({ error: 'Failed to create task' }, { status: 500 })
  }

  return Response.json({ task }, { status: 201 })
}
