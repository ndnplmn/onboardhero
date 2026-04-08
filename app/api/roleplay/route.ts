import { streamText, convertToModelMessages } from 'ai'
import { model } from '@/lib/ai/groq'
import { createRoleplayConfig, SimulationMode } from '@/lib/ai/presets/roleplay'
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

  // Verify manager role
  const admin = createSupabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'manager') {
    return new Response('Forbidden', { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') as SimulationMode
  const employeeData = {
    name: searchParams.get('employeeName') || 'New Hire',
    role: searchParams.get('role') || 'Team Member',
    riskScore: parseInt(searchParams.get('riskScore') || '0'),
    sentimentScore: parseInt(searchParams.get('sentimentScore') || '50'),
    blockers: [] // Dynamic fetch could be added here if needed
  }

  const { messages } = await req.json()

  const config = createRoleplayConfig({
    employeeName: employeeData.name,
    role: employeeData.role,
    mode: mode || 'RISK_INTERVENTION',
    riskScore: employeeData.riskScore,
    sentimentScore: employeeData.sentimentScore,
    recentBlockers: employeeData.blockers
  })

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model,
    system: config.systemPrompt,
    messages: modelMessages,
  })

  return result.toUIMessageStreamResponse()
}
