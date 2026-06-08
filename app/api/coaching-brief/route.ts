import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'
import { model } from '@/lib/ai/groq'
import { generateText } from 'ai'

const callLog = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_CALLS = 30

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

  const { name, riskScore, sentimentScore, progress, currentWeek, lastPulse, frictionPoints, pendingTasks, journeyId } = await req.json()

  const prompt = `You are a senior leadership coach giving a concise briefing about a new hire's onboarding status.

Hire data:
- Name: ${name}
- Week: ${currentWeek}
- Risk Score: ${riskScore}/100 (higher = more at risk)
- Sentiment Score: ${sentimentScore}/100
- Progress: ${progress}%
- Last Pulse Check Score: ${lastPulse != null ? `${lastPulse}/5` : 'Not submitted'}
- Pending Tasks: ${pendingTasks}
- Reported Friction Points: ${frictionPoints?.length ? frictionPoints.join('; ') : 'None'}

Write 2-4 short, actionable bullet points for the manager. Be specific and empathetic. Focus on what the manager should DO this week.
Format: one bullet per line, starting with "•". No headers, no preamble.`

  try {
    const { text } = await generateText({ model, prompt, maxOutputTokens: 200 })
    const bullets = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('•'))
      .map(l => l.slice(1).trim())
      .filter(Boolean)

    const finalBullets = bullets.length ? bullets : [text.trim()]

    const admin = createSupabaseAdmin()
    const noteContent = `AI Brief – ${name} (Week ${currentWeek}):\n${finalBullets.map(b => `• ${b}`).join('\n')}`
    const savedAt = new Date().toISOString()
    const insertPayload: Record<string, unknown> = {
      manager_id: user.id,
      content:    noteContent,
      source:     'ai',
      created_at: savedAt,
    }
    if (journeyId) insertPayload.journey_id = journeyId
    void admin.from('coaching_notes').insert(insertPayload)

    return Response.json({ bullets: finalBullets, savedAt })
  } catch {
    return Response.json({ error: 'AI unavailable' }, { status: 500 })
  }
}
