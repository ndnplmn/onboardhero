import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/lib/db/types'

export async function getUser(): Promise<Profile> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use admin client to bypass RLS — avoids recursive policy issues on profiles
  const admin = createSupabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Profile missing — sign out to avoid redirect loop
    await supabase.auth.signOut()
    redirect('/login')
  }

  return profile as Profile
}
