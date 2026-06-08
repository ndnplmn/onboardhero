import { NextRequest } from 'next/server'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { createSupabaseServer } = await import('@/lib/db/supabase-server')
  const supabase = await createSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const admin = createSupabaseAdmin()

  // Fetch current due_date
  const { data: task } = await admin
    .from('journey_tasks')
    .select('due_date')
    .eq('id', id)
    .single()

  const currentDue = task?.due_date ? new Date(task.due_date) : new Date()
  currentDue.setDate(currentDue.getDate() + 7)
  const newDueDate = currentDue.toISOString().split('T')[0]

  const { error } = await admin
    .from('journey_tasks')
    .update({ due_date: newDueDate })
    .eq('id', id)

  if (error) {
    console.error('relax error:', error)
    return Response.json({ error: 'Failed to extend due date' }, { status: 500 })
  }

  return Response.json({ success: true, newDueDate })
}
