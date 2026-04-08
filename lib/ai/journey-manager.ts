import { generateObject } from 'ai'
import { groq } from './groq'
import { z } from 'zod'

export interface JourneyMutation {
  type: 'ADD_TASK' | 'PRIORITIZE' | 'RELAX'
  reason: string
  taskTitle?: string
  taskDescription?: string
  affectedTaskId?: string
}

/**
 * getJourneyMutations
 * Analyzes journey context and friction to suggest dynamic adjustments.
 */
export async function getJourneyMutations(
  journeyId: string,
  frictionPoints: any[],
  currentTasks: any[]
): Promise<JourneyMutation[]> {
  if (frictionPoints.length === 0) return []

  const { object } = await generateObject({
    model: groq('llama-3.3-70b-versatile'),
    schema: z.object({
      mutations: z.array(z.object({
        type: z.enum(['ADD_TASK', 'PRIORITIZE', 'RELAX']),
        reason: z.string(),
        taskTitle: z.string().optional(),
        taskDescription: z.string().optional(),
        affectedTaskId: z.string().optional()
      }))
    }),
    prompt: `
      Analyze the current onboarding journey friction and suggest 1-2 dynamic "mutations" to improve integration.
      
      Friction Points:
      ${JSON.stringify(frictionPoints, null, 2)}
      
      Current Tasks Summary:
      ${currentTasks.map(t => t.title).join(', ')}
      
      Rules:
      - If technical friction is high, ADD_TASK for specific setup or mentoring.
      - If social/culture friction is high, PRIORITIZE team coffee chats or social events.
      - If velocity is extremely low, CONSIDER RELAXING (delaying) non-essential theoretical tasks.
    `,
  })

  return object.mutations as JourneyMutation[]
}
