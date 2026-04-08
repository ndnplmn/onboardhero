import { generateText } from 'ai'
import { groq } from './groq'

export type AgentType = 'IT_HELPDESK' | 'HR_CULTURE' | 'CAREER_COACH' | 'GENERAL'

interface AgentResponse {
  agent: AgentType
  content: string
  suggestedActions?: { label: string; action: string }[]
}

/**
 * MultiAgentOrchestrator
 * Routes user queries to specialized agents based on intent analysis.
 */
export async function routeToSpecializedAgent(
  query: string,
  context: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<AgentResponse> {
  // Step 1: Intent Classification
  const { text: classification } = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    prompt: `
      Analyze the following user query and classify it into one of these specialized agents:
      - IT_HELPDESK: Technical issues, laptop setup, VPN, security access, software installation.
      - HR_CULTURE: Benefits, payroll, company culture, holidays, feedback, social events.
      - CAREER_COACH: Role-specific guidance, growth paths, milestone planning, career advice.
      - GENERAL: Casual greetings or non-specific inquiries.

      Query: "${query}"
      
      Return ONLY the agent ID.
    `,
  })

  const agent = classification.trim() as AgentType

  // Step 2: Generate specialized response (placeholder for specialized prompts)
  const systemPrompts: Record<AgentType, string> = {
    IT_HELPDESK: "You are Hero IT, a technical support specialist. Be efficient, direct, and solution-oriented.",
    HR_CULTURE: "You are Hero HR, a culture and benefits expert. Be warm, supportive, and informative.",
    CAREER_COACH: "You are the Hero Career Coach. Be inspiring, strategic, and focused on long-term growth.",
    GENERAL: "You are the Onboarding Hero Assistant. Be helpful and friendly."
  }

  const { text: response } = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    system: `${systemPrompts[agent] || systemPrompts.GENERAL}. Context: ${context}`,
    messages: [
      ...history,
      { role: 'user', content: query }
    ],
  })

  // suggested actions based on agent
  const suggestedActions: Record<AgentType, { label: string; action: string }[]> = {
    IT_HELPDESK: [{ label: 'Open Support Ticket', action: '/it-support' }],
    HR_CULTURE: [{ label: 'View Company Handbook', action: '/resources/handbook' }],
    CAREER_COACH: [{ label: 'Book 1:1 Coaching', action: '/coach' }],
    GENERAL: [{ label: 'Explore Features', action: '/platform' }]
  }

  return {
    agent,
    content: response,
    suggestedActions: suggestedActions[agent]
  }
}
