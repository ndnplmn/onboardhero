import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { model } from '@/lib/ai/groq'
import { createManagerCoachConfig } from '@/lib/ai/presets/manager-coach'
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

  // Get profile and verify manager role (admin bypasses RLS)
  const admin = createSupabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return new Response('Profile not found', { status: 404 })
  }

  if (profile.role !== 'manager') {
    return new Response('Forbidden: Manager role required', { status: 403 })
  }

  const config = createManagerCoachConfig({
    name: profile.full_name ?? 'Manager',
    managerId: user.id,
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
