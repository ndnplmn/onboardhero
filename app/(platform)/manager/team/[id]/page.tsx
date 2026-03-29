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
  const { journey, tasks, checkIns } = await getTeamMemberDetail(id)

  if (!journey) return <div style={{ padding: '32px' }}>Journey not found</div>

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '8px' }}>{journey.employee.full_name}</h1>
          <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
            Week {journey.current_week} · {journey.employee.department || 'General'} · <RiskBadge score={journey.risk_score} />
          </p>
        </div>
        <TeamMemberCoachButton
          employeeName={journey.employee.full_name}
          journeyId={journey.id}
        />
      </div>

      <JourneyTimeline currentWeek={journey.current_week} checkIns={checkIns} />

      <CheckInActions checkIns={checkIns} />

      <TeamMemberTasks tasks={tasks} currentWeek={journey.current_week} />

      {journey.risk_score > 30 && (
        <div style={{ marginTop: '32px', background: 'var(--amber-bg)', padding: '20px', borderRadius: 'var(--r-lg)' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', marginBottom: '12px', color: 'var(--amber)' }}>
            <i className="fa-solid fa-triangle-exclamation"></i> Risk Indicators
          </h2>
          {(journey.risk_reasons as string[])?.length > 0 ? (
            <ul style={{ paddingLeft: '20px', color: 'var(--text2)' }}>
              {(journey.risk_reasons as string[]).map((reason: string, i: number) => (
                <li key={i} style={{ marginBottom: '4px' }}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text2)' }}>Risk detected but no specific reasons recorded yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
