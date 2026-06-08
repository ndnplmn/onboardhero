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

  // Get active journey with manager + risk signals
  const { data: journey } = await admin
    .from('journeys')
    .select('id, current_week, status, risk_score, friction_points, manager:profiles!manager_id(full_name)')
    .eq('employee_id', user.id)
    .in('status', ['in_progress', 'at_risk', 'not_started', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!journey) {
    return new Response('No active journey found', { status: 404 })
  }

  // Fetch pending tasks for this week to give Aura real-time task context
  const { data: pendingTasks } = await admin
    .from('journey_tasks')
    .select('id, title, status, week')
    .eq('journey_id', journey.id)
    .in('status', ['pending', 'in_progress'])
    .eq('week', journey.current_week ?? 1)
    .order('week')
    .limit(5)

  const managerData = Array.isArray((journey as any).manager) ? (journey as any).manager[0] : (journey as any).manager
  const frictionPoints: string[] = Array.isArray((journey as any).friction_points) ? (journey as any).friction_points : []

  const config = createChatbotConfig({
    name:             profile.full_name ?? 'Team Member',
    role:             profile.role ?? 'Employee',
    department:       profile.department ?? 'General',
    currentWeek:      (journey as any).current_week ?? 1,
    journeyId:        journey.id,
    userId:           user.id,
    managerName:      managerData?.full_name ?? undefined,
    riskScore:        (journey as any).risk_score ?? undefined,
    pendingTaskCount: pendingTasks?.length ?? 0,
    pendingTaskTitle: pendingTasks?.[0]?.title ?? undefined,
    frictionPoints:   frictionPoints.slice(0, 3),
  })

  const { messages } = await req.json()

  // Load last 5 messages from previous session to give the AI memory
  const { data: prevSession } = await admin
    .from('ai_conversations')
    .select('messages')
    .eq('user_id', user.id)
    .eq('preset', 'chatbot')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const sessionHistory: { role: string; content: string }[] =
    prevSession?.messages?.slice(-5) ?? []

  const modelMessages = await convertToModelMessages([
    ...sessionHistory.map((m: any) => ({ role: m.role, content: m.content })),
    ...messages,
  ])

  // Persist the new messages to the conversation table (fire and forget)
  const allMessages = [
    ...sessionHistory,
    ...messages.map((m: any) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      timestamp: new Date().toISOString(),
    })),
  ]
  void admin.from('ai_conversations').upsert(
    { user_id: user.id, journey_id: journey.id, preset: 'chatbot', messages: allMessages.slice(-20) },
    { onConflict: 'user_id,preset' }
  )

  const result = streamText({
    model,
    system: config.systemPrompt,
    messages: modelMessages,
    tools: config.tools,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
