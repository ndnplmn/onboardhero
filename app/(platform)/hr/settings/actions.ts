'use server'

import { createSupabaseServer } from '@/lib/db/supabase-server'
import { revalidatePath } from 'next/cache'

export type SettingsPayload = {
  org:           { name: string; industry: string; size: string; timezone: string; departments: string[] }
  roles:         Record<string, boolean>
  ai:            { riskThreshold: number; scanFrequency: string; sentimentEnabled: boolean; autoAlerts: boolean; aiModel: string; taskOverdueDays: number; hireInactiveDays: number; lowMoraleThreshold: number }
  notifications: { events: Record<string, boolean>; digestDay: string; digestTime: string }
}

export async function loadSettings(): Promise<SettingsPayload | null> {
  try {
    const supabase = await createSupabaseServer()
    const { data, error } = await supabase
      .from('company_settings')
      .select('key, value')
      .in('key', ['org', 'roles', 'ai', 'notifications'])

    if (error || !data?.length) return null

    const map: Record<string, any> = {}
    for (const row of data) map[row.key] = row.value
    return map as SettingsPayload
  } catch {
    return null
  }
}

export async function saveSettings(payload: SettingsPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const rows = Object.entries(payload).map(([key, value]) => ({
      key,
      value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('company_settings')
      .upsert(rows, { onConflict: 'key' })

    if (error) return { ok: false, error: error.message }

    revalidatePath('/hr/settings')
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}
