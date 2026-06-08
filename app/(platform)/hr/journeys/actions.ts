'use server'

import { createSupabaseServer } from '@/lib/db/supabase-server'
import { revalidatePath } from 'next/cache'
import { getUser } from '@/lib/auth/get-user'

// ── Template CRUD ──────────────────────────────────────────────────────────

export async function createTemplate(formData: FormData) {
  const supabase = await createSupabaseServer()
  const user = await getUser()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const roleType = formData.get('role_type') as string
  const department = formData.get('department') as string
  const tasksJson = formData.get('tasks') as string

  const { data: template, error } = await supabase
    .from('journey_templates')
    .insert({ name, description, role_type: roleType, department, created_by: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  if (tasksJson) {
    const tasks = JSON.parse(tasksJson) as Array<{ title: string; description: string; week: number; assigned_to_role: string; order: number }>
    const { error: tasksError } = await supabase.from('template_tasks').insert(
      tasks.map(t => ({
        template_id: template.id,
        title: t.title,
        description: t.description || '',
        week: t.week,
        assigned_to_role: t.assigned_to_role || 'new_hire',
        order: t.order || 0,
      }))
    )
    if (tasksError) {
      await supabase.from('journey_templates').delete().eq('id', template.id)
      return { error: tasksError.message }
    }
  }

  revalidatePath('/hr/journeys')
  return { success: true, templateId: template.id }
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createSupabaseServer()
  await supabase.from('journey_templates').delete().eq('id', templateId)
  revalidatePath('/hr/journeys')
}

export async function cloneTemplate(templateId: string) {
  const supabase = await createSupabaseServer()
  const user = await getUser()

  const { data: original } = await supabase.from('journey_templates').select('*').eq('id', templateId).single()
  if (!original) return { error: 'Template not found' }

  const { data: originalTasks } = await supabase.from('template_tasks').select('*').eq('template_id', templateId).order('week').order('order')

  const { data: newTemplate, error } = await supabase
    .from('journey_templates')
    .insert({
      name: `${original.name} (Copy)`,
      description: original.description,
      role_type: original.role_type,
      department: original.department,
      duration_days: original.duration_days,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  if (originalTasks && originalTasks.length > 0) {
    await supabase.from('template_tasks').insert(
      originalTasks.map((t: any) => ({
        template_id: newTemplate.id,
        title: t.title,
        description: t.description,
        week: t.week,
        assigned_to_role: t.assigned_to_role,
        order: t.order,
      }))
    )
  }

  revalidatePath('/hr/journeys')
  return { success: true }
}

// ── Assign journey to a hire ───────────────────────────────────────────────

const TEMPLATE_DEFAULT_GOALS: Record<string, { milestone: 'day_30' | 'day_60' | 'day_90'; title: string; description: string }[]> = {
  Engineering: [
    { milestone: 'day_30', title: 'Dev environment & first PR', description: 'Set up local environment, complete codebase walkthrough, and merge first PR.' },
    { milestone: 'day_60', title: 'Own a full feature end-to-end', description: 'Design, implement, and ship a production feature with full test coverage.' },
    { milestone: 'day_90', title: 'Lead sprint planning independently', description: 'Drive sprint ceremonies, write technical specs, and mentor a peer.' },
  ],
  Sales: [
    { milestone: 'day_30', title: 'CRM setup & product certification', description: 'Complete CRM onboarding, pass demo certification, and shadow 3 customer calls.' },
    { milestone: 'day_60', title: 'First solo prospect pipeline', description: 'Build a personal pipeline of 10+ prospects and run 5 solo discovery calls.' },
    { milestone: 'day_90', title: 'Close first deal', description: 'Close a deal independently, hitting first quota milestone.' },
  ],
}

const DEFAULT_GOALS: { milestone: 'day_30' | 'day_60' | 'day_90'; title: string; description: string }[] = [
  { milestone: 'day_30', title: 'Complete onboarding checklist', description: 'Finish all required tasks, meet the team, and complete IT + benefits setup.' },
  { milestone: 'day_60', title: 'Deliver first contribution', description: 'Complete a meaningful project or deliverable with manager sign-off.' },
  { milestone: 'day_90', title: 'Operate independently', description: 'Work autonomously on core responsibilities with minimal guidance.' },
]

export async function assignJourneyToEmployee(templateId: string, employeeId: string, managerId: string) {
  const supabase = await createSupabaseServer()

  const { error } = await supabase.rpc('create_journey_from_template', {
    p_employee_id: employeeId,
    p_template_id: templateId,
    p_manager_id: managerId,
  })

  if (error) return { error: error.message }

  // Seed default goals based on template department
  const { data: template } = await supabase
    .from('journey_templates')
    .select('department')
    .eq('id', templateId)
    .single()

  const { data: journey } = await supabase
    .from('journeys')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('template_id', templateId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (journey?.id) {
    const dept = (template as any)?.department ?? ''
    const goalSet = TEMPLATE_DEFAULT_GOALS[dept] ?? DEFAULT_GOALS
    await supabase.from('journey_goals').insert(
      goalSet.map(g => ({
        journey_id: journey.id,
        milestone:  g.milestone,
        title:      g.title,
        description: g.description,
        status:     'not_started',
      }))
    )
  }

  revalidatePath('/hr/employees')
  revalidatePath('/hr/journeys')
  revalidatePath('/manager/dashboard')
  return { success: true }
}

// ── Seed one of the built-in starter templates ─────────────────────────────

const STARTER_DEFINITIONS: Record<string, {
  name: string; role_type: string; department: string; description: string; duration_days: number;
  tasks: { title: string; week: number; assigned_to_role: string }[]
}> = {
  standard: {
    name: '90-Day Standard',
    role_type: 'General',
    department: 'All Departments',
    description: 'Universal onboarding journey covering culture, tools, and first deliverables.',
    duration_days: 90,
    tasks: [
      { title: 'Complete IT setup checklist', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Meet your buddy', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Review company handbook', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Set up benefits enrollment', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Week 1 check-in with manager', week: 1, assigned_to_role: 'manager' },
      { title: 'First project kickoff', week: 3, assigned_to_role: 'manager' },
      { title: '30-day HR review', week: 4, assigned_to_role: 'hr' },
      { title: '60-day performance review', week: 8, assigned_to_role: 'manager' },
      { title: '90-day completion review', week: 12, assigned_to_role: 'hr' },
    ],
  },
  engineering: {
    name: 'Engineering Fast-Track',
    role_type: 'Engineer',
    department: 'Engineering',
    description: 'Accelerated technical ramp-up for software engineers with early code contributions.',
    duration_days: 90,
    tasks: [
      { title: 'Dev environment setup', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Codebase walkthrough with buddy', week: 1, assigned_to_role: 'new_hire' },
      { title: 'First PR reviewed & merged', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Architecture deep-dive session', week: 2, assigned_to_role: 'manager' },
      { title: 'Own first ticket end-to-end', week: 3, assigned_to_role: 'new_hire' },
      { title: 'Code review standards training', week: 2, assigned_to_role: 'new_hire' },
      { title: '30-day technical assessment', week: 4, assigned_to_role: 'manager' },
      { title: 'Lead a sprint planning session', week: 8, assigned_to_role: 'new_hire' },
      { title: '90-day engineering review', week: 12, assigned_to_role: 'hr' },
    ],
  },
  sales: {
    name: 'Sales Enablement',
    role_type: 'Sales',
    department: 'Sales',
    description: 'Sales onboarding focused on product mastery, pitch certification, and first deals.',
    duration_days: 90,
    tasks: [
      { title: 'CRM setup and training', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Product demo certification', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Shadow 3 customer calls', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Pitch deck review with manager', week: 2, assigned_to_role: 'manager' },
      { title: 'First solo prospect call', week: 4, assigned_to_role: 'new_hire' },
      { title: 'Competitive landscape training', week: 3, assigned_to_role: 'new_hire' },
      { title: '30-day quota plan sign-off', week: 4, assigned_to_role: 'manager' },
      { title: 'Close first deal', week: 10, assigned_to_role: 'new_hire' },
      { title: '90-day sales review', week: 12, assigned_to_role: 'hr' },
    ],
  },
  customer_success: {
    name: 'Customer Success Fast-Track',
    role_type: 'Customer Success Manager',
    department: 'Customer Success',
    description: 'Ramp CSMs on product, customers, and health metrics for fast value delivery.',
    duration_days: 90,
    tasks: [
      { title: 'Product trial walkthrough (full)', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Shadow 3 onboarding calls with senior CSM', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Read 10 customer health records', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Complete CSM certification', week: 3, assigned_to_role: 'new_hire' },
      { title: 'Assign first customer portfolio', week: 4, assigned_to_role: 'manager' },
      { title: 'First solo QBR prep', week: 6, assigned_to_role: 'new_hire' },
      { title: '30-day CS methodology review', week: 4, assigned_to_role: 'manager' },
      { title: 'Present customer health dashboard', week: 8, assigned_to_role: 'new_hire' },
      { title: '90-day CS performance review', week: 12, assigned_to_role: 'hr' },
    ],
  },
  marketing: {
    name: 'Marketing Onboarding',
    role_type: 'Marketing',
    department: 'Marketing',
    description: 'Brand, tools, and campaign ownership ramp for marketing hires.',
    duration_days: 90,
    tasks: [
      { title: 'Brand guidelines & tone-of-voice review', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Marketing stack access & setup', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Audit last 3 campaigns', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Meet with content, demand gen, and product marketing', week: 2, assigned_to_role: 'new_hire' },
      { title: 'First campaign contribution (assist)', week: 3, assigned_to_role: 'new_hire' },
      { title: '30-day channel strategy review', week: 4, assigned_to_role: 'manager' },
      { title: 'Own first solo campaign end-to-end', week: 8, assigned_to_role: 'new_hire' },
      { title: 'Present Q2 growth experiments', week: 10, assigned_to_role: 'new_hire' },
      { title: '90-day marketing review', week: 12, assigned_to_role: 'hr' },
    ],
  },
  finance: {
    name: 'Finance & Operations',
    role_type: 'Finance',
    department: 'Finance',
    description: 'Structured ramp for finance roles focused on systems, compliance, and reporting.',
    duration_days: 90,
    tasks: [
      { title: 'Finance systems access & setup (NetSuite, Stripe, etc.)', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Review chart of accounts and closing calendar', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Shadow monthly close process', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Compliance & SOC2 training', week: 2, assigned_to_role: 'new_hire' },
      { title: '30-day financial controls review', week: 4, assigned_to_role: 'manager' },
      { title: 'Own one reporting area independently', week: 6, assigned_to_role: 'new_hire' },
      { title: 'Prepare first board-ready report section', week: 9, assigned_to_role: 'new_hire' },
      { title: 'Budget planning contribution', week: 10, assigned_to_role: 'new_hire' },
      { title: '90-day finance performance review', week: 12, assigned_to_role: 'hr' },
    ],
  },
  product: {
    name: 'Product Manager Ramp',
    role_type: 'Product Manager',
    department: 'Product',
    description: 'Discovery, stakeholder alignment, and first roadmap ownership for new PMs.',
    duration_days: 90,
    tasks: [
      { title: 'Read all product specs and PRDs from last 2 quarters', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Conduct 5 user interviews with existing customers', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Meet engineering, design, and data leads', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Review current product roadmap & strategy', week: 2, assigned_to_role: 'manager' },
      { title: 'Shadow 2 sprint planning and retro sessions', week: 2, assigned_to_role: 'new_hire' },
      { title: 'Write first product spec (small scoped)', week: 4, assigned_to_role: 'new_hire' },
      { title: '30-day PM craft review with VP Product', week: 4, assigned_to_role: 'manager' },
      { title: 'Own first epic from kickoff to ship', week: 10, assigned_to_role: 'new_hire' },
      { title: '90-day roadmap ownership review', week: 12, assigned_to_role: 'hr' },
    ],
  },
  design: {
    name: 'Design Onboarding',
    role_type: 'Designer',
    department: 'Design',
    description: 'Design system, user research, and first shipped design for product/UX designers.',
    duration_days: 90,
    tasks: [
      { title: 'Design system deep-dive & component library', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Figma org setup & file structure review', week: 1, assigned_to_role: 'new_hire' },
      { title: 'Review 5 recent shipped features (critique lens)', week: 2, assigned_to_role: 'new_hire' },
      { title: 'User research methodology session with UX lead', week: 2, assigned_to_role: 'new_hire' },
      { title: 'First design crit participation', week: 3, assigned_to_role: 'new_hire' },
      { title: '30-day design quality calibration', week: 4, assigned_to_role: 'manager' },
      { title: 'Own first end-to-end design project', week: 7, assigned_to_role: 'new_hire' },
      { title: 'Present to full product team', week: 9, assigned_to_role: 'new_hire' },
      { title: '90-day design impact review', week: 12, assigned_to_role: 'hr' },
    ],
  },
}

export async function saveGeneratedTemplate(data: {
  name: string
  description: string
  role_type: string
  department: string
  duration_days: number
  tasks: { title: string; description: string; week: number; assigned_to_role: string; order: number }[]
}) {
  const supabase = await createSupabaseServer()
  const user = await getUser()

  const { data: template, error } = await supabase
    .from('journey_templates')
    .insert({
      name: data.name,
      description: data.description,
      role_type: data.role_type,
      department: data.department,
      duration_days: data.duration_days,
      ai_generated: true,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  const { error: tasksError } = await supabase.from('template_tasks').insert(
    data.tasks.map((t, i) => ({
      template_id: template.id,
      title: t.title,
      description: t.description,
      week: t.week,
      assigned_to_role: t.assigned_to_role,
      order: t.order ?? i,
    }))
  )

  if (tasksError) {
    await supabase.from('journey_templates').delete().eq('id', template.id)
    return { error: tasksError.message }
  }

  revalidatePath('/hr/journeys')
  return { success: true, templateId: template.id }
}

export async function seedStarterTemplate(key: string) {
  const supabase = await createSupabaseServer()
  const user = await getUser()
  const def = STARTER_DEFINITIONS[key]
  if (!def) return { error: 'Unknown starter template' }

  const { data: template, error } = await supabase
    .from('journey_templates')
    .insert({
      name: def.name,
      description: def.description,
      role_type: def.role_type,
      department: def.department,
      duration_days: def.duration_days,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  const { error: tasksError } = await supabase.from('template_tasks').insert(
    def.tasks.map((t, i) => ({
      template_id: template.id,
      title: t.title,
      description: '',
      week: t.week,
      assigned_to_role: t.assigned_to_role,
      order: i,
    }))
  )

  if (tasksError) {
    await supabase.from('journey_templates').delete().eq('id', template.id)
    return { error: tasksError.message }
  }

  revalidatePath('/hr/journeys')
  return { success: true, templateId: template.id }
}

// ── Data fetchers for assign modal ────────────────────────────────────────

export async function getAvailableHires(): Promise<{ id: string; full_name: string; department: string }[]> {
  const supabase = await createSupabaseServer()
  const { data: hires } = await supabase
    .from('profiles')
    .select('id, full_name, department')
    .eq('role', 'new_hire')
    .eq('active', true)

  const { data: journeys } = await supabase
    .from('journeys')
    .select('employee_id')
    .eq('status', 'active')

  const assignedIds = new Set((journeys || []).map((j: any) => j.employee_id))
  return (hires || []).filter((h: any) => !assignedIds.has(h.id))
}

export async function getManagersList(): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'manager')
    .eq('active', true)
  return (data || []) as { id: string; full_name: string }[]
}

export interface TemplatePerf {
  activeHires: number
  completedHires: number
  avgCompletionPct: number
  avgTTP: number | null
}

export async function getTemplatesWithTasks() {
  const supabase = await createSupabaseServer()
  const [templatesRes, tasksRes, journeysRes, journeyTasksRes] = await Promise.all([
    supabase.from('journey_templates').select('*').order('created_at', { ascending: false }),
    supabase.from('template_tasks').select('*').order('week').order('order'),
    supabase.from('journeys').select('id, template_id, status, start_date').not('template_id', 'is', null),
    supabase.from('journey_tasks').select('journey_id, status'),
  ])

  const tasksByTemplate: Record<string, any[]> = {}
  ;(tasksRes.data || []).forEach((t: any) => {
    if (!tasksByTemplate[t.template_id]) tasksByTemplate[t.template_id] = []
    tasksByTemplate[t.template_id].push(t)
  })

  // Build performance stats per template
  const jtMap: Record<string, { total: number; done: number }> = {}
  ;(journeyTasksRes.data || []).forEach((jt: any) => {
    if (!jtMap[jt.journey_id]) jtMap[jt.journey_id] = { total: 0, done: 0 }
    jtMap[jt.journey_id].total++
    if (jt.status === 'completed') jtMap[jt.journey_id].done++
  })

  const perfByTemplate: Record<string, TemplatePerf> = {}
  ;(journeysRes.data || []).forEach((j: any) => {
    const tid = j.template_id
    if (!tid) return
    if (!perfByTemplate[tid]) perfByTemplate[tid] = { activeHires: 0, completedHires: 0, avgCompletionPct: 0, avgTTP: null }
    const p = perfByTemplate[tid]
    if (j.status === 'completed') p.completedHires++
    else p.activeHires++
  })

  // Compute avg completion & TTP per template
  Object.keys(perfByTemplate).forEach(tid => {
    const journeys = (journeysRes.data || []).filter((j: any) => j.template_id === tid)
    const completions: number[] = []
    const ttps: number[] = []
    journeys.forEach((j: any) => {
      const jt = jtMap[j.id]
      if (!jt || jt.total === 0) return
      const pct = Math.round((jt.done / jt.total) * 100)
      completions.push(pct)
      if (j.start_date && pct > 0) {
        const elapsed = Math.max(1, Math.round((Date.now() - new Date(j.start_date).getTime()) / 86400000))
        const ttp = j.status === 'completed' ? Math.round(elapsed * 0.8) : Math.round(elapsed * 0.8 / (pct / 100))
        if (ttp > 0 && ttp <= 180) ttps.push(ttp)
      }
    })
    if (completions.length) {
      perfByTemplate[tid].avgCompletionPct = Math.round(completions.reduce((a, b) => a + b, 0) / completions.length)
    }
    if (ttps.length) {
      perfByTemplate[tid].avgTTP = Math.round(ttps.reduce((a, b) => a + b, 0) / ttps.length)
    }
  })

  return { templates: templatesRes.data || [], tasksByTemplate, perfByTemplate }
}
