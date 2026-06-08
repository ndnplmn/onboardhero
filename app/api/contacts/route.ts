import { NextRequest } from 'next/server'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'

export interface ContactDTO {
  id: string
  name: string
  role: string
  email?: string
  avatarUrl?: string
  slackId?: string
  slackTeamId?: string
}

/**
 * GET /api/contacts?journeyId={id}
 * Returns the manager and one HR contact for a given journey.
 * Authenticated new hire only — verifies the journey belongs to them.
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const journeyId = req.nextUrl.searchParams.get('journeyId')
  if (!journeyId) {
    return Response.json({ error: 'journeyId is required' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  // Verify the journey belongs to the authenticated user
  const { data: journey } = await admin
    .from('journeys')
    .select('id, manager_id, employee_id')
    .eq('id', journeyId)
    .eq('employee_id', user.id)
    .single()

  if (!journey) {
    return Response.json({ error: 'Journey not found' }, { status: 404 })
  }

  // Fetch manager profile
  const { data: manager } = await admin
    .from('profiles')
    .select('id, full_name, email, avatar_url, slack_id, slack_team_id')
    .eq('id', journey.manager_id)
    .single()

  // Fetch one HR contact
  const { data: hrContacts } = await admin
    .from('profiles')
    .select('id, full_name, email, avatar_url, slack_id, slack_team_id')
    .eq('role', 'hr')
    .limit(1)

  const contacts: ContactDTO[] = []

  if (manager) {
    contacts.push({
      id: manager.id,
      name: manager.full_name,
      role: 'Your Manager',
      email: manager.email ?? undefined,
      avatarUrl: manager.avatar_url ?? undefined,
      slackId: (manager as any).slack_id ?? undefined,
      slackTeamId: (manager as any).slack_team_id ?? undefined,
    })
  }

  if (hrContacts?.length) {
    const hr = hrContacts[0]
    contacts.push({
      id: hr.id,
      name: hr.full_name,
      role: 'HR',
      email: hr.email ?? undefined,
      avatarUrl: hr.avatar_url ?? undefined,
      slackId: (hr as any).slack_id ?? undefined,
      slackTeamId: (hr as any).slack_team_id ?? undefined,
    })
  }

  return Response.json({ contacts })
}
