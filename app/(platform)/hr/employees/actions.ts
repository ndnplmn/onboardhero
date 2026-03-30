'use server'

import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { revalidatePath } from 'next/cache'

export async function inviteUser(formData: FormData) {
  const supabase = createSupabaseAdmin()

  const email = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string
  const department = formData.get('department') as string
  const managerId = formData.get('manager_id') as string
  const templateId = formData.get('template_id') as string

  // Create user with auto-confirm
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })

  if (authError) {
    return { error: authError.message }
  }

  // Update profile with department
  if (authData.user) {
    await supabase
      .from('profiles')
      .update({ department })
      .eq('id', authData.user.id)

    // If new hire, create journey from template
    if (role === 'new_hire' && templateId && managerId) {
      await supabase.rpc('create_journey_from_template', {
        p_employee_id: authData.user.id,
        p_template_id: templateId,
        p_manager_id: managerId,
      })
    }
  }

  revalidatePath('/hr/employees')
  return { success: true }
}

export async function updateEmployee(formData: FormData) {
  const supabase = createSupabaseAdmin()
  const id = formData.get('id') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string
  const department = formData.get('department') as string
  const active = formData.get('active') === 'true'

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, role, department, active })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/hr/employees')
  return { success: true }
}

export async function deactivateEmployee(employeeId: string) {
  const supabase = createSupabaseAdmin()
  await supabase.from('profiles').update({ active: false }).eq('id', employeeId)
  revalidatePath('/hr/employees')
}

export async function reassignManager(journeyId: string, newManagerId: string) {
  const supabase = createSupabaseAdmin()
  await supabase.from('journeys').update({ manager_id: newManagerId }).eq('id', journeyId)
  await supabase.from('check_ins').update({ manager_id: newManagerId }).eq('journey_id', journeyId).is('completed_date', null)
  revalidatePath('/hr/employees')
  revalidatePath('/manager/dashboard')
}
