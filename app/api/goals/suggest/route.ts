import { generateText } from 'ai'
import { model } from '@/lib/ai/groq'
import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function POST(req: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return new Response('Unauthorized', { status: 401 })

  const { milestone, currentWeek, role, department, existingGoals = [] } = await req.json()

  const milestoneLabel = milestone === 'day_30' ? '30-day' : milestone === 'day_60' ? '60-day' : '90-day'
  const existingList   = (existingGoals as string[]).join(', ') || 'none yet'

  const prompt = `You are a career coach helping a new employee set their ${milestoneLabel} onboarding goal.

Context:
- Role: ${role || 'New Hire'}
- Department: ${department || 'General'}
- Current week: ${currentWeek || 1}
- Existing goals for this milestone: ${existingList}

Generate exactly 3 concise, actionable ${milestoneLabel} goals tailored to this person. Each goal should be specific, measurable, and achievable within the timeframe.

Rules:
- Each goal max 10 words
- No overlap with existing goals
- One sentence each, starting with a strong action verb
- Return ONLY a JSON array of 3 strings, no explanation

Example format: ["Complete security training and pass quiz", "Schedule 1:1 with all 5 team leads", "Submit Q2 project proposal for review"]`

  try {
    const { text } = await generateText({ model, prompt })
    const cleaned = text.trim().replace(/^[^[]*/, '').replace(/[^\]]*$/, '')
    const suggestions: string[] = JSON.parse(cleaned)
    if (!Array.isArray(suggestions)) throw new Error('Invalid format')
    return Response.json({ suggestions: suggestions.slice(0, 3) })
  } catch {
    return Response.json({ suggestions: [
      `Complete core ${milestoneLabel} onboarding tasks`,
      `Build relationships with 3 key stakeholders`,
      `Deliver first independent project milestone`,
    ] })
  }
}
