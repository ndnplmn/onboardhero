import { createSupabaseServer } from '@/lib/db/supabase-server'
import { model } from '@/lib/ai/groq'
import { generateText } from 'ai'

// Simple per-user in-memory rate limit: max 20 calls per 10 minutes
const callLog = new Map<string, number[]>()
const WINDOW_MS  = 10 * 60 * 1000
const MAX_CALLS  = 20

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
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { chartType, data, benchmarks } = await req.json()

  const descriptions: Record<string, string> = {
    overview:   'overall onboarding completion and risk metrics',
    risk:       'hire risk scores and at-risk journey distribution',
    checkins:   'check-in completion rates across milestones',
    feedback:   'hire feedback ratings and satisfaction scores',
    cohort:     'cohort comparison data across hiring batches',
    roi:        'ROI and time-to-productivity metrics',
  }

  const desc = descriptions[chartType] ?? 'onboarding analytics'

  const prompt = `You are a senior HR analytics expert. Analyze this ${desc} data and write exactly 2 sentences of insight.

Data summary: ${JSON.stringify(data).slice(0, 800)}
${benchmarks ? `Industry benchmarks: ${JSON.stringify(benchmarks)}` : ''}

Rules:
- Sentence 1: State the most important finding with a specific number.
- Sentence 2: Give one actionable recommendation for the HR team.
- Be direct and specific. No hedging, no "it appears", no caveats.
- Under 60 words total.`

  try {
    const { text } = await generateText({ model, prompt, maxOutputTokens: 120 })
    return Response.json({ insight: text.trim() })
  } catch {
    return Response.json({ error: 'AI unavailable' }, { status: 500 })
  }
}
