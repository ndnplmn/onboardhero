import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EmployeeJourneyClient from './EmployeeJourneyClient'

export const dynamic = 'force-dynamic'

// Mock journeys for when DB is empty
const MOCK_JOURNEYS: Record<string, { employee: any; journey: any; tasks: any[] }> = {
  '1': {
    employee: { id: '1', full_name: 'Marcus Reed', email: 'marcus@company.com', role: 'new_hire', department: 'Product', avatar_url: 'https://i.pravatar.cc/150?u=marcus', phone: '+1 555 234 5678', bio: 'Senior Product Designer passionate about user research and design systems.', created_at: '2026-01-15' },
    journey: { id: 'j1', status: 'in_progress', current_week: 2, risk_score: 18, sentiment_score: 82, start_date: '2026-04-06', progress: 24 },
    tasks: [
      { id: 't1', title: 'Complete IT onboarding checklist', week: 1, status: 'completed', assigned_to_role: 'new_hire', description: 'Set up laptop, install required tools, configure VPN and security settings.' },
      { id: 't2', title: 'Meet with your manager', week: 1, status: 'completed', assigned_to_role: 'new_hire', description: 'First 1:1 with your manager to discuss expectations and 30-day goals.' },
      { id: 't3', title: 'Read company culture guide', week: 1, status: 'completed', assigned_to_role: 'new_hire', description: 'Review the company wiki: culture, values, remote-work norms, and team rituals.' },
      { id: 't4', title: 'Join design team standup', week: 2, status: 'in_progress', assigned_to_role: 'new_hire', description: 'Attend daily standup to get familiar with team workflow and ongoing projects.' },
      { id: 't5', title: 'Schedule 30-day review', week: 2, status: 'pending', assigned_to_role: 'manager', description: 'HR to schedule the first formal 30-day check-in with employee and manager.' },
      { id: 't6', title: 'Complete security training', week: 2, status: 'pending', assigned_to_role: 'new_hire', description: 'Complete mandatory cybersecurity training module and pass the certification quiz.' },
    ],
  },
  '2': {
    employee: { id: '2', full_name: 'Priya Mehta', email: 'priya@company.com', role: 'new_hire', department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya', phone: '+1 555 345 6789', bio: 'Frontend Engineer specializing in React and TypeScript. Loves accessibility and performance.', created_at: '2026-02-21' },
    journey: { id: 'j2', status: 'at_risk', current_week: 7, risk_score: 74, sentiment_score: 38, start_date: '2026-02-21', progress: 68 },
    tasks: [
      { id: 't1', title: 'Dev environment setup', week: 1, status: 'completed', assigned_to_role: 'new_hire', description: 'Configure local dev environment, clone repos, and run the app locally.' },
      { id: 't2', title: 'First code review participation', week: 2, status: 'completed', assigned_to_role: 'new_hire', description: 'Review at least 3 pull requests and leave constructive feedback.' },
      { id: 't3', title: 'Submit first PR', week: 3, status: 'completed', assigned_to_role: 'new_hire', description: 'Open your first pull request for a starter issue from the backlog.' },
      { id: 't4', title: 'Mid-point check-in with manager', week: 6, status: 'completed', assigned_to_role: 'manager', description: 'Formal 45-day check-in to assess progress, blockers, and adjustment to team norms.' },
      { id: 't5', title: 'Lead a sprint planning meeting', week: 7, status: 'in_progress', assigned_to_role: 'new_hire', description: 'Shadow and then lead one sprint planning session with guidance from the team lead.' },
      { id: 't6', title: 'Complete frontend certification', week: 7, status: 'pending', assigned_to_role: 'new_hire', description: 'Finish the internal frontend standards certification covering a11y and performance.' },
      { id: 't7', title: 'Schedule risk intervention', week: 7, status: 'pending', assigned_to_role: 'hr', description: '⚠️ Risk detected — schedule an intervention call with manager and HR.' },
    ],
  },
  '3': {
    employee: { id: '3', full_name: 'Sarah Kim', email: 'sarah@company.com', role: 'new_hire', department: 'People', avatar_url: 'https://i.pravatar.cc/150?u=sarah', phone: '+1 555 456 7890', bio: 'HR Operations specialist focused on employee experience and process improvement.', created_at: '2026-03-17' },
    journey: { id: 'j3', status: 'in_progress', current_week: 5, risk_score: 12, sentiment_score: 91, start_date: '2026-03-17', progress: 92 },
    tasks: [
      { id: 't1', title: 'Complete HR system access setup', week: 1, status: 'completed', assigned_to_role: 'new_hire', description: 'Get access to HRIS, ATS, and benefits portal. Complete initial training modules.' },
      { id: 't2', title: 'Shadow 3 HR processes', week: 2, status: 'completed', assigned_to_role: 'new_hire', description: 'Observe onboarding, offboarding, and a performance review process end-to-end.' },
      { id: 't3', title: 'Handle first employee inquiry independently', week: 3, status: 'completed', assigned_to_role: 'new_hire', description: 'Respond to an employee question or request without manager assistance.' },
      { id: 't4', title: 'Present process improvement proposal', week: 4, status: 'completed', assigned_to_role: 'new_hire', description: 'Identify one process inefficiency and present a solution to the People team.' },
      { id: 't5', title: '60-day review', week: 5, status: 'in_progress', assigned_to_role: 'manager', description: 'Two-month formal review — assess cultural fit, skill development, and satisfaction.' },
    ],
  },
  '4': {
    employee: { id: '4', full_name: 'James Wilson', email: 'james@company.com', role: 'new_hire', department: 'Sales', avatar_url: 'https://i.pravatar.cc/150?u=james', phone: '+1 555 567 8901', bio: 'Sales Account Executive focused on enterprise deals. Background in SaaS and fintech.', created_at: '2026-01-06' },
    journey: { id: 'j4', status: 'completed', current_week: 13, risk_score: 5, sentiment_score: 96, start_date: '2026-01-06', progress: 100 },
    tasks: [
      { id: 't1', title: 'CRM setup and training', week: 1, status: 'completed', assigned_to_role: 'new_hire', description: 'Configure Salesforce, learn the pipeline stages, and shadow 3 discovery calls.' },
      { id: 't2', title: 'Demo certification', week: 2, status: 'completed', assigned_to_role: 'new_hire', description: 'Complete the product demo certification — must score 90%+ to pass.' },
      { id: 't3', title: 'First outbound campaign', week: 4, status: 'completed', assigned_to_role: 'new_hire', description: 'Launch a 50-prospect outbound sequence with manager review and coaching.' },
      { id: 't4', title: 'First closed deal', week: 10, status: 'completed', assigned_to_role: 'new_hire', description: '🎉 Milestone — close first unaided deal. Qualifies for the accelerator bonus.' },
      { id: 't5', title: '90-day graduation review', week: 13, status: 'completed', assigned_to_role: 'hr', description: 'Final review and transition from onboarding to standard performance management.' },
    ],
  },
}

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  let employee = null
  let journey  = null
  let tasks: any[] = []

  try {
    const admin = createSupabaseAdmin()

    const { data: profileData } = await admin
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (profileData) {
      employee = profileData

      const { data: journeyData } = await admin
        .from('journeys')
        .select('*')
        .eq('employee_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (journeyData) {
        journey = journeyData
        const { data: taskData } = await admin
          .from('journey_tasks')
          .select('*')
          .eq('journey_id', journeyData.id)
          .order('week', { ascending: true })
        tasks = taskData ?? []
      }
    }
  } catch {}

  // Fall back to mock data if DB returns nothing for this id
  const mock = MOCK_JOURNEYS[params.id]
  if (!employee && !mock) notFound()

  const resolvedEmployee = employee ?? mock?.employee
  const resolvedJourney  = journey  ?? mock?.journey
  const resolvedTasks    = tasks.length > 0 ? tasks : (mock?.tasks ?? [])

  return (
    <EmployeeJourneyClient
      employee={resolvedEmployee}
      journey={resolvedJourney}
      tasks={resolvedTasks}
    />
  )
}
