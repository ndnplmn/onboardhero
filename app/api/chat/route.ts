import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { model } from '@/lib/ai/groq'
import { createChatbotConfig } from '@/lib/ai/presets/chatbot'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const admin = createSupabaseAdmin()

  // Get profile
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, role, department')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return new Response('Profile not found', { status: 404 })
  }

  // Get active journey
  const { data: journey } = await admin
    .from('journeys')
    .select('id, current_week, status')
    .eq('employee_id', user.id)
    .in('status', ['in_progress', 'at_risk', 'not_started'])
    .limit(1)
    .single()

  if (!journey) {
    return new Response('No active journey found', { status: 404 })
  }

  const config = createChatbotConfig({
    name: profile.full_name ?? 'Team Member',
    role: profile.role ?? 'Employee',
    department: profile.department ?? 'General',
    currentWeek: journey.current_week ?? 1,
    journeyId: journey.id,
    userId: user.id,
  })

  const { messages } = await req.json()

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model,
    system: config.systemPrompt,
    messages: modelMessages,
    tools: config.tools,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
