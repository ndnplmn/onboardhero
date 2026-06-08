'use server'

import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response('Unauthorized', { status: 401 })

    const { journeyId, week, radarSnapshot } = await req.json()
    if (!journeyId || !week || !Array.isArray(radarSnapshot)) {
      return new Response('Missing fields', { status: 400 })
    }

    // Upsert: merge radar_snapshot into existing pulse_check row for this week,
    // or create a row with score=null if none exists yet.
    const { error } = await supabase
      .from('pulse_checks')
      .upsert(
        { journey_id: journeyId, week, radar_snapshot: radarSnapshot },
        { onConflict: 'journey_id,week', ignoreDuplicates: false }
      )

    if (error) return new Response(error.message, { status: 500 })
    return new Response('OK', { status: 200 })
  } catch (e: any) {
    return new Response(e.message, { status: 500 })
  }
}
