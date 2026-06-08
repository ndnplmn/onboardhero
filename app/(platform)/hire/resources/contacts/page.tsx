import { getUser } from '@/lib/auth/get-user'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/db/supabase-server'
import KeyContactsClient, { type ContactData } from './KeyContactsClient'

export const dynamic = 'force-dynamic'

const FALLBACK_CONTACTS: ContactData[] = [
  {
    name:              'HR Team',
    role:              'HR Operations',
    type:              'HR Support',
    typeId:            'hr',
    typeColor:         'var(--green)',
    bio:               'Your first stop for benefits, payroll, and company policy questions during onboarding.',
    email:             'hr@company.com',
    slackHandle:       '@hr-support',
    avatar:            'https://i.pravatar.cc/150?u=hr-team',
    availability:      'available',
    availabilityLabel: 'Available Mon–Fri 9–5',
    isReal:            false,
  },
]

export default async function KeyContactsPage() {
  const user   = await getUser()
  const supabase = await createSupabaseServer()
  const admin  = createSupabaseAdmin()

  const { data: journey } = await supabase
    .from('journeys')
    .select('id, manager_id')
    .eq('employee_id', user.id)
    .in('status', ['active', 'in_progress', 'at_risk', 'not_started'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const contacts: ContactData[] = []

  if (journey?.manager_id) {
    const { data: mgr } = await admin
      .from('profiles')
      .select('id, full_name, role, department, email, avatar_url')
      .eq('id', journey.manager_id)
      .single()

    if (mgr) {
      contacts.push({
        name:              mgr.full_name,
        role:              mgr.role === 'manager' ? `${mgr.department ?? 'Engineering'} Manager` : mgr.role,
        type:              'Direct Manager',
        typeId:            'manager',
        typeColor:         'var(--blue)',
        bio:               `Your direct manager during onboarding. Reach out to align on priorities, unblock decisions, or discuss your progress.`,
        email:             mgr.email ?? `${mgr.full_name.toLowerCase().replace(' ', '.')}@company.com`,
        slackHandle:       `@${mgr.full_name.toLowerCase().replace(' ', '.')}`,
        avatar:            mgr.avatar_url ?? `https://i.pravatar.cc/150?u=${mgr.id}`,
        availability:      'available',
        availabilityLabel: 'Available for 1:1s',
        isReal:            true,
      })
    }
  }

  // HR contact — fetch any hr-role profile via admin
  const { data: hrProfile } = await admin
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('role', 'hr')
    .limit(1)
    .maybeSingle()

  if (hrProfile) {
    contacts.push({
      name:              hrProfile.full_name,
      role:              'HR Operations Manager',
      type:              'HR Support',
      typeId:            'hr',
      typeColor:         'var(--green)',
      bio:               'Expert in benefits, payroll, and company policy. Your first stop for any HR-related questions during onboarding.',
      email:             hrProfile.email ?? 'hr@company.com',
      slackHandle:       `@${hrProfile.full_name.toLowerCase().replace(' ', '.')}`,
      avatar:            hrProfile.avatar_url ?? `https://i.pravatar.cc/150?u=${hrProfile.id}`,
      availability:      'available',
      availabilityLabel: 'Available Mon–Fri',
      isReal:            true,
    })
  } else {
    contacts.push(FALLBACK_CONTACTS[0])
  }

  // Buddy / Mentor — not yet in schema; show placeholder cards so hires know to ask
  contacts.push({
    name:              'Your Social Buddy',
    role:              'Peer Colleague',
    type:              'Social Buddy',
    typeId:            'buddy',
    typeColor:         'var(--cyan)',
    bio:               'A peer assigned to help you settle in socially and culturally. Contact HR to get your buddy assigned.',
    email:             '',
    slackHandle:       '',
    avatar:            'https://i.pravatar.cc/150?u=buddy-placeholder',
    availability:      'away',
    availabilityLabel: 'Not yet assigned',
    isReal:            false,
  })

  contacts.push({
    name:              'Your Technical Mentor',
    role:              'Senior Team Member',
    type:              'Technical Mentor',
    typeId:            'mentor',
    typeColor:         'var(--violet)',
    bio:               'A senior engineer assigned to guide your technical onboarding. Contact HR or your manager to get a mentor assigned.',
    email:             '',
    slackHandle:       '',
    avatar:            'https://i.pravatar.cc/150?u=mentor-placeholder',
    availability:      'away',
    availabilityLabel: 'Not yet assigned',
    isReal:            false,
  })

  return <KeyContactsClient contacts={contacts} />
}
