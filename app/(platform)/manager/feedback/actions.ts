'use server'

import { createSupabaseServer } from '@/lib/db/supabase-server'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/get-user'

export async function saveFeedbackResponse(
  itemId: string,
  source: 'form' | 'check-in',
  text: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServer()
  const user = await getUser()

  if (source === 'check-in') {
    const { error } = await supabase
      .from('check_ins')
      .update({ manager_notes: text })
      .eq('id', itemId)
      .eq('manager_id', user.id)

    if (error) return { error: error.message }
  } else {
    // form submission — look up journey_id then insert into manager_notes
    const { data: submission } = await supabase
      .from('form_submissions')
      .select('journey_id')
      .eq('id', itemId)
      .single()

    if (!submission?.journey_id) return { error: 'Could not find associated journey' }

    const { error } = await supabase
      .from('manager_notes')
      .insert({
        journey_id: submission.journey_id,
        manager_id: user.id,
        content: text,
        source: 'note',
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/manager/feedback')
  return {}
}
