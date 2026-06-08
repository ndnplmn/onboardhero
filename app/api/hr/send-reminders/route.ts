import { NextRequest } from 'next/server'
import { inngest } from '@/inngest/client'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createSupabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['hr', 'manager', 'admin'].includes(profile.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { journeyIds, reason: rawReason } = await req.json() as {
    journeyIds: string[]
    reason?: string
  }

  if (!Array.isArray(journeyIds) || journeyIds.length === 0) {
    return Response.json({ error: 'journeyIds required' }, { status: 400 })
  }

  const reason = (rawReason ?? 'Your manager wants to check in on your onboarding progress.')
    .replace(/<[^>]*>/g, '')
    .slice(0, 500)
    .trim()

  const { data: journeys } = await admin
    .from('journeys')
    .select('id, employee_id, manager_id')
    .in('id', journeyIds.slice(0, 50))

  if (!journeys?.length) return Response.json({ queued: 0 })

  const { data: managerProfile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const managerName = managerProfile?.full_name ?? 'HR'

  await inngest.send(
    journeys.map(j => ({
      name: 'app/nudge.send' as const,
      data: {
        journeyId:  j.id,
        managerId:  j.manager_id ?? user.id,
        employeeId: j.employee_id,
        reason,
      },
    }))
  )

  const notifications = journeys.map(j => ({
    user_id:    j.employee_id,
    type:       'nudge',
    title:      `${managerName} sent you a check-in reminder`,
    message:    reason,
    action_url: '/hire/dashboard',
  }))
  await admin.from('notifications').insert(notifications)

  return Response.json({ queued: journeys.length })
}
