'use server'

import { routeToSpecializedAgent, AgentType } from '@/lib/ai/orchestrator'

export async function askAura(
  query: string, 
  context: string,
  history: { role: 'user' | 'assistant'; content: string }[]
) {
  try {
    const response = await routeToSpecializedAgent(query, context, history)
    return { success: true, data: response }
  } catch (error) {
    console.error('Aura Error:', error)
    return { success: false, error: 'Aura is temporarily recharging. Please try again soon.' }
  }
}
