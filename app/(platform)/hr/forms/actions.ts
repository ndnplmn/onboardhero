'use server'

import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { getUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function createForm(formData: FormData) {
  const supabase = createSupabaseAdmin()
  const user = await getUser()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const department = formData.get('department') as string
  const fields = formData.get('fields') as string

  const { error } = await supabase
    .from('onboarding_forms')
    .insert({
      title,
      description,
      department: department || null,
      fields: JSON.parse(fields),
      created_by: user.id,
    })

  if (error) return { error: error.message }

  revalidatePath('/hr/forms')
  return { success: true }
}

export async function deleteForm(formId: string) {
  const supabase = createSupabaseAdmin()
  await supabase.from('onboarding_forms').delete().eq('id', formId)
  revalidatePath('/hr/forms')
}
