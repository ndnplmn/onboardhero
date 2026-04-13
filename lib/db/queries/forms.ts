import { createSupabaseServer } from '@/lib/db/supabase-server'

export async function getAllForms() {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('onboarding_forms')
    .select('id, title, description, created_at')
    .order('created_at', { ascending: false })
  return data || []
}

export async function getFormsForEmployee(employeeId: string) {
  const supabase = await createSupabaseServer()

  const [formsRes, submissionsRes] = await Promise.all([
    supabase
      .from('onboarding_forms')
      .select('id, title, description, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('form_submissions')
      .select('form_id')
      .eq('employee_id', employeeId),
  ])

  const submittedFormIds = new Set((submissionsRes.data || []).map((s: any) => s.form_id))
  return (formsRes.data || []).map((f: any) => ({
    ...f,
    submitted: submittedFormIds.has(f.id),
  }))
}

export async function getFormSubmissions(formId?: string) {
  const supabase = await createSupabaseServer()
  let query = supabase
    .from('form_submissions')
    .select('id, submitted_at, responses, employee:profiles!employee_id(full_name, email, department), form:onboarding_forms!form_id(title)')
    .order('submitted_at', { ascending: false })

  if (formId) query = query.eq('form_id', formId)

  const { data } = await query
  return data || []
}

export async function getManagerFeedbackData(managerId: string) {
  const supabase = await createSupabaseServer()

  // Get all journey IDs for this manager
  const { data: journeys } = await supabase
    .from('journeys')
    .select('id, employee:profiles!employee_id(id, full_name, department, avatar_url)')
    .eq('manager_id', managerId)

  const employeeIds = (journeys || []).map((j: any) => {
    const emp = Array.isArray(j.employee) ? j.employee[0] : j.employee
    return emp?.id
  }).filter(Boolean)

  if (employeeIds.length === 0) return { submissions: [], checkInFeedback: [] }

  // Get form submissions from those employees
  const [submissionsRes, checkInsRes] = await Promise.all([
    supabase
      .from('form_submissions')
      .select('id, submitted_at, responses, employee:profiles!employee_id(id, full_name, department, avatar_url), form:onboarding_forms!form_id(id, title)')
      .in('employee_id', employeeIds)
      .order('submitted_at', { ascending: false }),
    // Also fetch completed check-in notes as feedback signals
    supabase
      .from('check_ins')
      .select('id, type, completed_date, notes, journey:journeys!journey_id(employee:profiles!employee_id(id, full_name, department, avatar_url))')
      .eq('manager_id', managerId)
      .not('completed_date', 'is', null)
      .not('notes', 'is', null)
      .order('completed_date', { ascending: false })
      .limit(20),
  ])

  return {
    submissions:     submissionsRes.data || [],
    checkInFeedback: checkInsRes.data    || [],
  }
}
