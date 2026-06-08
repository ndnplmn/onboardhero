import { createSupabaseServer } from '@/lib/db/supabase-server'
import { model } from '@/lib/ai/groq'
import { generateText } from 'ai'

const callLog = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_CALLS = 20

function isRateLimited(userId: string): boolean {
  const now   = Date.now()
  const calls = (callLog.get(userId) ?? []).filter(t => now - t < WINDOW_MS)
  if (calls.length >= MAX_CALLS) return true
  callLog.set(userId, [...calls, now])
  return false
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (isRateLimited(user.id)) {
    return Response.json({ error: 'Rate limit exceeded. Try again in a few minutes.' }, { status: 429 })
  }

  const { hireName, managerName, riskScore, currentWeek, lastPulse, frictionPoints, pendingTasks, context } = await req.json()

  const urgency = riskScore >= 70 ? 'urgent — this hire is at high risk'
    : riskScore >= 40 ? 'proactive — the hire has some friction signals'
    : 'routine weekly check-in'

  const prompt = `You are a senior manager writing a short, warm check-in message to a new hire.

Context:
- Manager: ${managerName ?? 'Your manager'}
- Hire: ${hireName}
- Week: ${currentWeek} of onboarding
- Risk Score: ${riskScore}/100 (${urgency})
- Last Pulse Score: ${lastPulse != null ? `${lastPulse}/5` : 'not submitted yet'}
- Pending Tasks: ${pendingTasks}
- Friction Points: ${frictionPoints?.length ? frictionPoints.slice(0, 3).join('; ') : 'none reported'}
- Additional context: ${context ?? 'none'}

Write a short, human Slack/email message the manager can send directly. It should:
- Open with a warm greeting using the hire's first name
- Acknowledge where they are in their journey (week ${currentWeek})
- Ask one specific question based on their current status
- Offer help without being intrusive
- Close naturally, signing as the manager

Keep it under 100 words. Conversational tone. No headers. Plain text only.`

  try {
    const { text } = await generateText({ model, prompt, maxOutputTokens: 180 })
    return Response.json({ message: text.trim() })
  } catch {
    return Response.json({ error: 'AI unavailable' }, { status: 500 })
  }
}
