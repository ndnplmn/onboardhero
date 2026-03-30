import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function getAllForms() {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('onboarding_forms')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function getFormsForEmployee(employeeId: string) {
  const supabase = createSupabaseAdmin()

  const { data: forms } = await supabase
    .from('onboarding_forms')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('form_id')
    .eq('employee_id', employeeId)

  const submittedFormIds = new Set((submissions || []).map((s: any) => s.form_id))

  return (forms || []).map((f: any) => ({
    ...f,
    submitted: submittedFormIds.has(f.id),
  }))
}

export async function getFormSubmissions(formId?: string) {
  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('form_submissions')
    .select('*, employee:profiles!employee_id(full_name, email, department), form:onboarding_forms!form_id(title)')
    .order('submitted_at', { ascending: false })

  if (formId) query = query.eq('form_id', formId)

  const { data } = await query
  return data || []
}
