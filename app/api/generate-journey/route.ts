import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { model } from '@/lib/ai/groq'
import { createJourneyGeneratorConfig } from '@/lib/ai/presets/journey-generator'
import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Verify HR role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'hr') {
    return new Response('Forbidden: HR role required', { status: 403 })
  }

  const config = createJourneyGeneratorConfig(user.id)

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
