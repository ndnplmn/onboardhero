import { NextRequest } from 'next/server'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { journey_id, type, scheduled_date, notes } = body as {
    journey_id: string
    type: string
    scheduled_date: string
    notes?: string
  }

  if (!journey_id || !type || !scheduled_date) {
    return Response.json({ error: 'journey_id, type, and scheduled_date are required' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  // Verify the manager owns this journey
  const { data: journey } = await admin
    .from('journeys')
    .select('id, manager_id, employee_id')
    .eq('id', journey_id)
    .single()

  if (!journey || journey.manager_id !== user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: checkIn, error } = await admin
    .from('check_ins')
    .insert({
      journey_id,
      manager_id: user.id,
      milestone: type,
      scheduled_date,
      notes: notes ?? null,
      completed_date: null,
    })
    .select()
    .single()

  if (error) {
    console.error('check-in insert error:', error)
    return Response.json({ error: 'Failed to schedule check-in' }, { status: 500 })
  }

  // Notify the employee
  await admin.from('notifications').insert({
    user_id: journey.employee_id,
    type: 'checkin_reminder',
    title: 'Check-in Scheduled',
    message: `Your manager has scheduled a ${type.replace(/_/g, '-')} check-in for ${scheduled_date}.`,
    action_url: '/hire/calendar',
  })

  return Response.json({ checkIn }, { status: 201 })
}
