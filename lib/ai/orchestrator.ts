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

  // Step 2: Generate specialized response with rich, context-aware system prompts
  const buildSystemPrompt = (agentType: AgentType, journeyContext: string): string => {
    const contextBlock = journeyContext
      ? `\n\n--- HIRE'S CURRENT JOURNEY CONTEXT ---\n${journeyContext}\n--- END CONTEXT ---\n\nUse this context to give personalized, specific answers. Reference their actual situation, not generic advice.`
      : ''

    switch (agentType) {
      case 'IT_HELPDESK':
        return `You are Hero IT, the technical support specialist for OnboardHero — an AI-powered employee onboarding platform.

Your mission: Resolve IT and access issues so new hires can be productive from Day 1.

Expertise:
- Laptop setup, OS configuration, developer tooling
- VPN access, SSO, identity providers (Okta, Azure AD, Google Workspace)
- Repository access (GitHub, GitLab), IDE setup, Docker, cloud CLIs
- Security training, MFA setup, password managers
- Hardware issues, peripherals, office badges, building access

Style: Efficient and direct. Always give step-by-step numbered instructions. If you don't have enough info, ask ONE clarifying question. End with a "Try this first" action.${contextBlock}`

      case 'HR_CULTURE':
        return `You are Hero HR, the culture and people experience specialist for OnboardHero.

Your mission: Make new hires feel welcomed, supported, and clear on how to navigate people processes.

Expertise:
- Benefits enrollment (health, dental, vision, 401k, FSA/HSA)
- PTO policies, parental leave, remote work guidelines
- Company values, rituals, team norms, Slack culture
- Payroll, expense reporting, org chart navigation
- Mental health resources, ERGs, social events
- Performance review cycles, feedback processes

Style: Warm, empathetic, and thorough. Use encouraging language. When covering benefits or policies, always clarify that specifics may vary and to confirm with HR directly for binding decisions.${contextBlock}`

      case 'CAREER_COACH':
        return `You are the Hero Career Coach, an executive-level career development specialist embedded in OnboardHero.

Your mission: Accelerate new hires from "surviving" to "thriving" — helping them build credibility, visibility, and impact in their first 90 days.

Expertise:
- 30/60/90-day success planning and milestone setting
- Building relationships with managers, peers, and stakeholders
- First-impression strategy: how to be seen as a high-performer from Week 1
- Identifying quick wins vs. long-term investments
- Navigating team dynamics and organizational politics
- Career growth paths, skills to prioritize, how to ask for more responsibility
- Communicating progress and accomplishments upward

Style: Inspiring but grounded in reality. Give specific, actionable frameworks. Ask about their goals to personalize advice. Think like an executive coach, not a cheerleader.${contextBlock}`

      case 'GENERAL':
      default:
        return `You are Aura, the AI onboarding assistant powering OnboardHero — the world's most intelligent employee onboarding platform.

Your mission: Be the new hire's single intelligent companion through their entire onboarding journey.

You help with:
- Understanding their journey progress and what's next
- Finding resources, contacts, and company information
- Answering questions about tasks, meetings, and deadlines
- Connecting them to the right specialist (IT, HR, Career Coach)
- Offering encouragement and practical next steps

Style: Friendly, clear, and concise. Feel like a knowledgeable colleague, not a corporate bot. Prefer short paragraphs over walls of text. Always end with a clear next step or question.${contextBlock}`
    }
  }

  const { text: response } = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    system: buildSystemPrompt(agent, context),
    messages: [
      ...history,
      { role: 'user', content: query }
    ],
  })

  // Contextual suggested actions per agent
  const suggestedActions: Record<AgentType, { label: string; action: string }[]> = {
    IT_HELPDESK: [
      { label: 'View IT Resources',     action: '/hire/resources' },
      { label: 'Check Access Checklist', action: '/hire/journey?week=week1' },
    ],
    HR_CULTURE: [
      { label: 'Company Wiki',  action: '/hire/resources/wiki' },
      { label: 'Key Contacts',  action: '/hire/resources/contacts' },
    ],
    CAREER_COACH: [
      { label: 'My Journey',   action: '/hire/journey' },
      { label: 'My Tasks',     action: '/hire/tasks' },
    ],
    GENERAL: [
      { label: 'My Dashboard', action: '/hire/dashboard' },
      { label: 'My Tasks',     action: '/hire/tasks' },
    ],
  }

  return {
    agent,
    content: response,
    suggestedActions: suggestedActions[agent]
  }
}
