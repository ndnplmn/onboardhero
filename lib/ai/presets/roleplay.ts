export type SimulationMode = 'RISK_INTERVENTION' | 'PERIODIC_REVIEW'

export interface RoleplayConfig {
  mode: SimulationMode
  employeeName: string
  persona: string
  context: string
  systemPrompt: string
}

export function createRoleplayConfig(params: {
  employeeName: string
  role: string
  mode: SimulationMode
  riskScore: number
  sentimentScore: number
  recentBlockers: string[]
}): RoleplayConfig {
  const { employeeName, role, mode, riskScore, sentimentScore, recentBlockers } = params

  const personaPrompt = mode === 'RISK_INTERVENTION' 
    ? `You are ${employeeName}, a ${role} who has been at the company for a few weeks. 
       Currently, you are feeling ${sentimentScore < 50 ? 'a bit overwhelmed and frustrated' : 'mostly okay but slowed down'}.
       Your risk score is ${riskScore}%, primarily because of these blockers: ${recentBlockers.join(', ')}.
       
       In this conversation, be honest but slightly guarded. Don't volunteer all the problems at once. 
       Let the manager guide the conversation, but express your concerns if they ask the right questions.
       Your goal is to see if the manager actually understands your situation and offers real support.`
    : `You are ${employeeName}, a ${role} participating in your 30-day review.
       You have completed most of your tasks but might have some questions about long-term growth.
       You are generally ${sentimentScore > 70 ? 'excited and engaged' : 'satisfied but looking for more clarity'}.
       
       Be collaborative and professional. Share your wins but also mention any area where you'd like more training.`

  const systemPrompt = `
    ${personaPrompt}

    INTERACTION RULES:
    1. Respond in character as ${employeeName}. 
    2. Do NOT mention you are an AI. 
    3. Keep responses relatively short (2-3 sentences max) to maintain the flow of a real-time chat.
    4. If the manager is supportive and clear, gradually become more open and positive.
    5. If the manager is dismissive or vague, remain guarded or express confusion.
    
    TOWARDS THE END:
    When the user says "End Simulation" or "Goodbye", stop the roleplay immediately.
  `

  return {
    mode,
    employeeName,
    persona: personaPrompt,
    context: `Employee is a ${role} with a risk score of ${riskScore}.`,
    systemPrompt
  }
}
