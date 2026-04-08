import { generateText } from 'ai'
import { model } from '@/lib/ai/groq'
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

  const { prompt } = await req.json()

  try {
    const { text } = await generateText({
      model,
      system: "You are an AI Leadership Coach. Analyze transcripts of manager-employee simulations and provide constructive feedback. Keep it to 3 concise bullet points.",
      prompt,
    })

    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Leadership Review Error:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate review' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
