import { createSupabaseServer } from '@/lib/db/supabase-server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/lib/db/types'

export async function getUser(): Promise<Profile> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return profile as Profile
}
