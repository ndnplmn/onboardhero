'use server'

import { routeToSpecializedAgent } from '@/lib/ai/orchestrator'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'

export type AuraMessage = { role: 'user' | 'assistant'; content: string }

const AURA_PRESET = 'aura'
const MAX_STORED  = 30  // rolling window kept in DB

export async function askAura(
  query: string,
  context: string,
  history: AuraMessage[],
) {
  try {
    const response = await routeToSpecializedAgent(query, context, history)

    // Persist in background (fire and forget — don't block the response)
    persistAuraMessages(history, query, response.content).catch(() => {})

    return { success: true, data: response }
  } catch (error) {
    console.error('Aura Error:', error)
    return { success: false, error: 'Aura is temporarily recharging. Please try again soon.' }
  }
}

export async function getAuraHistory(): Promise<AuraMessage[]> {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const admin = createSupabaseAdmin()
    const { data } = await admin
      .from('ai_conversations')
      .select('messages')
      .eq('user_id', user.id)
      .eq('preset', AURA_PRESET)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const raw: unknown[] = Array.isArray(data?.messages) ? data.messages : []
    const msgs = raw.filter(
      (m): m is AuraMessage =>
        typeof m === 'object' && m !== null &&
        (m as any).role === 'user' || (m as any).role === 'assistant',
    )
    return msgs.slice(-20)
  } catch {
    return []
  }
}

async function persistAuraMessages(
  history: AuraMessage[],
  newUserQuery: string,
  assistantReply: string,
) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createSupabaseAdmin()

    const updated: AuraMessage[] = [
      ...history,
      { role: 'user' as const,      content: newUserQuery   },
      { role: 'assistant' as const, content: assistantReply },
    ].slice(-MAX_STORED)

    await admin
      .from('ai_conversations')
      .upsert(
        { user_id: user.id, preset: AURA_PRESET, messages: updated },
        { onConflict: 'user_id,preset' },
      )
  } catch { /* ignore */ }
}
