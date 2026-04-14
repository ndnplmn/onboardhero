import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import { getTeamMemberDetail } from '@/lib/db/queries/manager'
import JourneyTimeline from '@/components/platform/JourneyTimeline'
import RiskBadge from '@/components/platform/RiskBadge'
import TeamMemberCoachButton from './TeamMemberCoachButton'
import TeamMemberTasks from './TeamMemberTasks'
import CheckInActions from './CheckInActions'

export const dynamic = 'force-dynamic'

// ── Mock fallback for demo journey IDs ────────────────────────────────────

const MOCK_JOURNEYS: Record<string, { journey: any; tasks: any[]; checkIns: any[] }> = {
  j1: {
    journey: { id: 'j1', status: 'in_progress', current_week: 3, risk_score: 18, start_date: '2026-03-01', risk_reasons: [], employee: { full_name: 'Marcus Reed', department: 'Product', avatar_url: 'https://i.pravatar.cc/150?u=marcus', email: 'marcus@company.com' } },
    tasks: [
      { id: 't1', title: 'Complete IT setup checklist',    week: 1, status: 'completed',  assigned_to_role: 'new_hire', description: 'Set up laptop, tools, and VPN access.' },
      { id: 't2', title: 'Meet your buddy',                week: 1, status: 'completed',  assigned_to_role: 'new_hire', description: 'Intro session with your assigned peer buddy.' },
      { id: 't3', title: 'Review company handbook',        week: 1, status: 'completed',  assigned_to_role: 'new_hire', description: 'Read the wiki on culture, values, and norms.' },
      { id: 't4', title: 'Submit benefits enrollment',     week: 2, status: 'in_progress', assigned_to_role: 'new_hire', description: 'Complete health, dental, and 401k elections.' },
      { id: 't5', title: 'Week 1 check-in with manager',  week: 1, status: 'completed',  assigned_to_role: 'manager',  description: 'First 1:1 to discuss expectations and goals.' },
      { id: 't6', title: 'First project kickoff',          week: 3, status: 'pending',    assigned_to_role: 'manager',  description: 'Kick off Marcus\'s first project assignment.' },
    ],
    checkIns: [],
  },
  j2: {
    journey: { id: 'j2', status: 'at_risk', current_week: 7, risk_score: 74, start_date: '2026-01-15', risk_reasons: ['No check-in in 2 weeks', '3 overdue tasks', 'Sentiment dropped 22 points'], employee: { full_name: 'Priya Mehta', department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya', email: 'priya@company.com' } },
    tasks: [
      { id: 't1', title: 'Dev environment setup',           week: 1, status: 'completed',  assigned_to_role: 'new_hire', description: 'Install required tools and configure local environment.' },
      { id: 't2', title: 'First PR reviewed & merged',      week: 2, status: 'completed',  assigned_to_role: 'new_hire', description: 'Open and merge first pull request.' },
      { id: 't3', title: 'Architecture deep-dive session',  week: 2, status: 'completed',  assigned_to_role: 'manager',  description: 'Walk Priya through the system architecture.' },
      { id: 't4', title: 'Lead a sprint planning session',  week: 7, status: 'in_progress', assigned_to_role: 'new_hire', description: 'Lead one sprint planning with guidance.' },
      { id: 't5', title: 'Complete frontend certification', week: 7, status: 'pending',    assigned_to_role: 'new_hire', description: 'Finish internal a11y and performance certification.' },
      { id: 't6', title: 'Schedule risk intervention',      week: 7, status: 'pending',    assigned_to_role: 'hr',       description: '⚠️ Risk detected — schedule intervention call.' },
    ],
    checkIns: [],
  },
  j4: {
    journey: { id: 'j4', status: 'in_progress', current_week: 2, risk_score: 12, start_date: new Date(Date.now() - 12 * 86400000).toISOString(), risk_reasons: [], employee: { full_name: 'Diana Torres', department: 'Design', avatar_url: 'https://i.pravatar.cc/150?u=diana', email: 'diana@company.com' } },
    tasks: [
      { id: 't1', title: 'Complete IT setup checklist', week: 1, status: 'completed',  assigned_to_role: 'new_hire', description: 'Set up laptop and design tools.' },
      { id: 't2', title: 'Design system onboarding',   week: 1, status: 'completed',  assigned_to_role: 'new_hire', description: 'Read and explore the product design system.' },
      { id: 't3', title: 'First design review',        week: 2, status: 'in_progress', assigned_to_role: 'new_hire', description: 'Present first design iteration to the team.' },
      { id: 't4', title: 'Meet with UX researcher',    week: 2, status: 'pending',    assigned_to_role: 'new_hire', description: 'Sync on user research methods and current studies.' },
    ],
    checkIns: [],
  },
}

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { journey: rawJourney, tasks: dbTasks, checkIns: dbCheckIns } = await getTeamMemberDetail(id)

  // Fall back to mock data if no DB record found
  const mock = MOCK_JOURNEYS[id]
  const journey = (rawJourney ?? mock?.journey) as any
  const tasks   = dbTasks.length   > 0 ? dbTasks   : (mock?.tasks   ?? [])
  const checkIns = dbCheckIns.length > 0 ? dbCheckIns : (mock?.checkIns ?? [])

  if (!journey) return (
    <div className="db-body">
      <div className="db-card">
        <div className="db-card-bd" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <i className="fa-solid fa-user-slash" style={{ fontSize: 28, color: 'var(--border2)', display: 'block', marginBottom: 12 }} aria-hidden="true" />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>Journey not found</p>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>{journey.employee.full_name}</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Week {journey.current_week} · {journey.employee.department || 'General'} · <RiskBadge score={journey.risk_score} />
          </p>
        </div>
        <div className="db-header-actions">
          <TeamMemberCoachButton
            employeeName={journey.employee.full_name}
            journeyId={journey.id}
          />
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
        <JourneyTimeline currentWeek={journey.current_week} checkIns={checkIns} />
        <CheckInActions checkIns={checkIns} />
        <TeamMemberTasks tasks={tasks} currentWeek={journey.current_week} />

        {journey.risk_score > 30 && (
          <div className="db-card">
            <div className="db-card-hd">
              <h3 style={{ color: 'var(--amber)' }}>
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Risk Indicators
              </h3>
            </div>
            <div className="db-card-bd">
              {(journey.risk_reasons as string[])?.length > 0 ? (
                <ul style={{ paddingLeft: 20, color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(journey.risk_reasons as string[]).map((reason: string, i: number) => (
                    <li key={i} style={{ fontSize: 13 }}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text3)' }}>Risk detected but no specific reasons recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
