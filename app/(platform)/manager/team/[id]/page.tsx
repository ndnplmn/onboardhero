import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import { getTeamMemberDetail } from '@/lib/db/queries/manager'
import JourneyTimeline from '@/components/platform/JourneyTimeline'
import RiskBadge from '@/components/platform/RiskBadge'
import TeamMemberCoachButton from './TeamMemberCoachButton'
import TeamMemberTasks from './TeamMemberTasks'
import CheckInActions from './CheckInActions'

export const dynamic = 'force-dynamic'

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { journey: rawJourney, tasks, checkIns } = await getTeamMemberDetail(id)
  const journey = rawJourney as any

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
