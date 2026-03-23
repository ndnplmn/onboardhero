import { tool } from 'ai'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export function getChatSentiment() {
  return tool({
    description:
      'Analyze recent chatbot conversations for a journey to detect sentiment signals. Returns keyword indicators, help request frequency, and overall sentiment direction.',
    inputSchema: z.object({
      journeyId: z.string().describe('The journey ID to analyze sentiment for'),
    }),
    execute: async ({ journeyId }) => {
      const supabase = createSupabaseAdmin()

      const { data: conversations, error } = await supabase
        .from('ai_conversations')
        .select('id, messages, created_at')
        .eq('journey_id', journeyId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        return { error: `Failed to fetch conversations: ${error.message}` }
      }

      if (!conversations || conversations.length === 0) {
        return {
          journeyId,
          conversationCount: 0,
          sentiment: 'neutral',
          signals: ['No chatbot conversations found — employee may not be engaging with the platform.'],
          helpRequestCount: 0,
          negativeKeywords: [],
          positiveKeywords: [],
        }
      }

      const negativePatterns = [
        'frustrated', 'confused', 'stuck', 'lost', 'overwhelmed', 'help',
        'difficult', 'hard', 'problem', 'issue', 'struggle', 'unclear',
        'don\'t understand', 'not working', 'wrong', 'fail', 'stress',
      ]
      const positivePatterns = [
        'thank', 'great', 'helpful', 'awesome', 'good', 'understand',
        'clear', 'progress', 'done', 'completed', 'happy', 'excited',
        'love', 'excellent', 'perfect',
      ]

      let negativeCount = 0
      let positiveCount = 0
      let helpRequestCount = 0
      const negativeKeywordsFound: string[] = []
      const positiveKeywordsFound: string[] = []

      for (const convo of conversations) {
        const messages = convo.messages as any[] | null
        if (!messages) continue

        for (const msg of messages) {
          if (msg.role !== 'user') continue
          const text = (msg.content || '').toLowerCase()

          for (const pattern of negativePatterns) {
            if (text.includes(pattern)) {
              negativeCount++
              if (!negativeKeywordsFound.includes(pattern)) {
                negativeKeywordsFound.push(pattern)
              }
            }
          }

          for (const pattern of positivePatterns) {
            if (text.includes(pattern)) {
              positiveCount++
              if (!positiveKeywordsFound.includes(pattern)) {
                positiveKeywordsFound.push(pattern)
              }
            }
          }

          if (text.includes('help') || text.includes('assist') || text.includes('escalat')) {
            helpRequestCount++
          }
        }
      }

      let sentiment: string
      const signals: string[] = []

      if (negativeCount > positiveCount * 2) {
        sentiment = 'negative'
        signals.push('Employee messages show predominantly negative sentiment.')
      } else if (positiveCount > negativeCount * 2) {
        sentiment = 'positive'
        signals.push('Employee messages show positive sentiment.')
      } else {
        sentiment = 'mixed'
        signals.push('Employee messages show mixed sentiment.')
      }

      if (helpRequestCount > 3) {
        signals.push(`High frequency of help requests (${helpRequestCount} detected).`)
      }

      if (conversations.length < 2) {
        signals.push('Very low chatbot engagement — employee may need encouragement to use the platform.')
      }

      return {
        journeyId,
        conversationCount: conversations.length,
        sentiment,
        signals,
        helpRequestCount,
        negativeKeywords: negativeKeywordsFound,
        positiveKeywords: positiveKeywordsFound,
        negativeSignalCount: negativeCount,
        positiveSignalCount: positiveCount,
      }
    },
  })
}
