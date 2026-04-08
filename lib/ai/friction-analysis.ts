import { generateObject } from 'ai'
import { model } from './groq'
import { z } from 'zod'

const FrictionPointSchema = z.object({
  id: z.string(),
  type: z.enum(['technical', 'culture', 'engagement', 'role_clarity', 'mentorship']),
  severity: z.enum(['low', 'medium', 'high']),
  label: z.string(),
  description: z.string(),
  day: z.number(),
  intervention: z.string(),
})

const FrictionAnalysisSchema = z.object({
  riskScore: z.number().min(0).max(100),
  summary: z.string(),
  frictionPoints: z.array(FrictionPointSchema),
  confidence: z.number().min(0).max(1),
})

export async function analyzeJourneyFriction(journeyData: any) {
  const { journey, tasks, checkIns } = journeyData

  const prompt = `
    Analyze this onboarding journey data for a "New Hire" and detect friction points.
    Today is Day ${Math.ceil((Date.now() - new Date(journey.start_date).getTime()) / (1000 * 60 * 60 * 24))}.
    
    Journey Status: ${journey.status}
    Current Week: ${journey.current_week}
    
    Tasks:
    ${JSON.stringify(tasks.map((t: any) => ({ 
      title: t.title, 
      week: t.week, 
      status: t.status, 
      category: t.category 
    })), null, 2)}
    
    Check-in Notes:
    ${JSON.stringify(checkIns.map((c: any) => ({ 
      date: c.scheduled_date, 
      sentiment: c.sentiment_score, 
      notes: c.manager_notes 
    })), null, 2)}
    
    Return a professional risk assessment. 
    A "Friction Point" is a specific event or pattern that is causing delay or low engagement.
    If multiple tasks in "Tech Setup" are incomplete by Week 2, that's a "technical" friction point.
    If check-in sentiment is dropping, that's an "engagement" friction point.
  `

  const { object } = await generateObject({
    model,
    schema: FrictionAnalysisSchema,
    prompt,
    system: "You are an expert HR Data Scientist and Senior Onboarding Coach. Your tone is professional, predictive, and actionable. You detect subtle patterns of failure in employee onboarding.",
  })

  return object
}
