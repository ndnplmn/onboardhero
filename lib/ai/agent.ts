import { streamText, generateText, stepCountIs, type ToolSet } from 'ai'
import { model } from './groq'

export type AgentPreset = 'chatbot' | 'journey_generator' | 'manager_coach' | 'risk_detector' | 'content_studio'

interface AgentConfig {
  systemPrompt: string
  tools: ToolSet
}

export function createStreamingAgent(config: AgentConfig) {
  return (messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) =>
    streamText({
      model,
      system: config.systemPrompt,
      messages,
      tools: config.tools,
      stopWhen: stepCountIs(5),
    })
}

export function createGenerativeAgent(config: AgentConfig) {
  return (prompt: string) =>
    generateText({
      model,
      system: config.systemPrompt,
      prompt,
      tools: config.tools,
      stopWhen: stepCountIs(5),
    })
}
