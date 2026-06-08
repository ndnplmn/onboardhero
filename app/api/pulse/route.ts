import { NextRequest } from 'next/server'
import { inngest } from '@/inngest/client'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { journey_id, week, score, question, note } = body as {
    journey_id: string
    week: number
    score: number
    question: string
    note?: string
  }

  if (!journey_id || !week || !score) {
    return Response.json({ error: 'journey_id, week, and score are required' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  // Server-side rate limit: 1 submission per calendar day per journey
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const { data: todayCheck } = await admin
    .from('pulse_checks')
    .select('id')
    .eq('journey_id', journey_id)
    .eq('employee_id', user.id)
    .gte('created_at', dayStart.toISOString())
    .limit(1)

  if (todayCheck?.length) {
    return Response.json({ error: 'Already submitted today', alreadySubmitted: true }, { status: 429 })
  }

  // Persist the pulse check (gracefully handles missing table)
  const { error: insertError } = await admin.from('pulse_checks').insert({
    journey_id,
    employee_id: user.id,
    week,
    score,
    question:   question ?? '',
    note:       note ?? null,
    created_at: new Date().toISOString(),
  })

  if (insertError) {
    // Table may not exist yet — log and continue (don't block the user)
    console.warn('pulse_checks insert failed (table may not exist):', insertError.message)
  }

  // If morale is critically low (≤ 2): notify manager immediately + fire Inngest
  if (score <= 2) {
    const { data: journey } = await admin
      .from('journeys')
      .select('manager_id, employee:profiles!employee_id(full_name)')
      .eq('id', journey_id)
      .single()

    const employeeName = (journey as any)?.employee?.full_name ?? 'A team member'

    // Direct notification to manager — include "why" note if provided
    if (journey?.manager_id) {
      const noteContext = note ? ` They shared: "${note}"` : ''
      await admin.from('notifications').insert({
        user_id: journey.manager_id,
        type:    'risk_alert',
        title:   `Low morale signal — ${employeeName}`,
        message: `${employeeName} rated their well-being ${score}/5 this week.${noteContext} Consider scheduling a check-in before it escalates.`,
        action_url: `/manager/dashboard`,
      })
    }

    // Check if we fired Inngest already this week to avoid duplicate AI re-scans
    const { data: recent } = await admin
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .ilike('title', '%Morale Alert%')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1)

    if (!recent?.length) {
      await inngest.send({
        name: 'journey/morale.low',
        data: { journeyId: journey_id, employeeId: user.id, week, score },
      })
    }
  }

  // 3-week declining trend detection — fire Inngest even when score > 2
  if (score > 2) {
    const { data: recentPulses } = await admin
      .from('pulse_checks')
      .select('score, week')
      .eq('journey_id', journey_id)
      .order('week', { ascending: false })
      .limit(3)

    if (recentPulses && recentPulses.length >= 3) {
      const [newest, middle, oldest] = recentPulses
      const isDeclining = oldest.score > middle.score && middle.score > newest.score
      if (isDeclining) {
        const { data: jrny } = await admin
          .from('journeys')
          .select('manager_id')
          .eq('id', journey_id)
          .single()

        if (jrny?.manager_id) {
          const { data: recentAlert } = await admin
            .from('notifications')
            .select('id')
            .eq('user_id', jrny.manager_id)
            .ilike('title', '%3-week%')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1)

          if (!recentAlert?.length) {
            await Promise.all([
              admin.from('notifications').insert({
                user_id:    jrny.manager_id,
                type:       'risk_alert',
                title:      '3-week morale decline detected',
                message:    `Pulse scores have dropped 3 weeks in a row: ${oldest.score} → ${middle.score} → ${newest.score}/5. A check-in conversation could help before this escalates.`,
                action_url: `/manager/dashboard`,
              }),
              inngest.send({
                name: 'journey/morale.low' as const,
                data: { journeyId: journey_id, employeeId: user.id, week, score },
              }),
            ])
          }
        }
      }
    }
  }

  // Compute team avg for this week (all hires, same week number)
  const { data: weekPulses } = await admin
    .from('pulse_checks')
    .select('score')
    .eq('week', week)

  const teamAvg = weekPulses && weekPulses.length > 0
    ? parseFloat((weekPulses.reduce((s: number, p: { score: number }) => s + p.score, 0) / weekPulses.length).toFixed(1))
    : null

  return Response.json({ success: true, score, teamAvg })
}
