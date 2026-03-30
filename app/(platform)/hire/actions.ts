'use server'

import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { getUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  const supabase = createSupabaseAdmin()

  await supabase
    .from('journey_tasks')
    .update({
      status: completed ? 'completed' : 'pending',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)

  revalidatePath('/hire/dashboard')
  revalidatePath('/hire/tasks')
}

export async function updateProfile(formData: FormData) {
  const supabase = createSupabaseAdmin()

  const id = formData.get('id') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const bio = formData.get('bio') as string
  const ecName = formData.get('ec_name') as string
  const ecPhone = formData.get('ec_phone') as string
  const ecRelationship = formData.get('ec_relationship') as string

  const emergencyContact = ecName ? { name: ecName, phone: ecPhone, relationship: ecRelationship } : {}

  await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      phone: phone || null,
      bio: bio || null,
      emergency_contact: emergencyContact,
    })
    .eq('id', id)

  revalidatePath('/hire/profile')
  revalidatePath('/hire/dashboard')
}
