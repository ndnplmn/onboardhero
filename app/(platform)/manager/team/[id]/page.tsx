import { getTeamMemberDetail } from '@/lib/db/queries/manager'
import JourneyTimeline from '@/components/platform/JourneyTimeline'
import RiskBadge from '@/components/platform/RiskBadge'

export const dynamic = 'force-dynamic'

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { journey, tasks, checkIns } = await getTeamMemberDetail(id)

  if (!journey) return <div style={{ padding: '32px' }}>Journey not found</div>

  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '8px' }}>{journey.employee.full_name}</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
        Week {journey.current_week} · {journey.employee.department || 'General'} · <RiskBadge score={journey.risk_score} />
      </p>

      <JourneyTimeline currentWeek={journey.current_week} checkIns={checkIns} />

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', marginBottom: '16px' }}>
          Tasks ({completedTasks}/{totalTasks} completed — {progress}%)
        </h2>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
          const weekTasks = tasks.filter((t: any) => t.week === week)
          if (weekTasks.length === 0) return null
          return (
            <div key={week} style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--text2)', marginBottom: '8px' }}>Week {week}</h3>
              {weekTasks.map((t: any) => (
                <div key={t.id} className="hc-emp" style={{ opacity: t.status === 'completed' ? 0.6 : 1 }}>
                  <i className={`fa-solid ${t.status === 'completed' ? 'fa-circle-check' : 'fa-circle'}`}
                     style={{ color: t.status === 'completed' ? 'var(--green)' : 'var(--text3)', width: '26px', textAlign: 'center' }}></i>
                  <div className="hce-info">
                    <strong>{t.title}</strong>
                    <span>{t.assigned_to_role === 'new_hire' ? 'New Hire' : t.assigned_to_role === 'manager' ? 'Manager' : 'HR'}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

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
