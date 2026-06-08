import { NextRequest } from 'next/server'
import { inngest } from '@/inngest/client'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createSupabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager') {
    return Response.json({ error: 'Forbidden: manager role required' }, { status: 403 })
  }

  const body = await req.json()
  const { journeyId, employeeId, reason } = body as {
    journeyId: string
    employeeId: string
    reason: string
  }

  if (!journeyId || !employeeId || !reason) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  await inngest.send({
    name: 'app/nudge.send',
    data: {
      journeyId,
      managerId: user.id,
      employeeId,
      reason,
    },
  })

  // Instantly surface an in-app notification for the hire so they know
  // their manager is paying attention — closes the feedback loop.
  const { data: managerProfile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  await admin.from('notifications').insert({
    user_id:    employeeId,
    type:       'nudge',
    title:      'Your manager checked in on you',
    message:    `${managerProfile?.full_name ?? 'Your manager'} sent you a message. Check your email for details.`,
    action_url: '/hire/dashboard',
  })

  return Response.json({ success: true })
}
