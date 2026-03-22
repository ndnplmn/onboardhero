import { getUser } from '@/lib/auth/get-user'
import { getManagerDashboardData } from '@/lib/db/queries/manager'
import TeamCard from '@/components/platform/TeamCard'
import KPICard from '@/components/platform/KPICard'

export const dynamic = 'force-dynamic'

export default async function ManagerDashboard() {
  const user = await getUser()
  const { journeys, upcomingCheckIns } = await getManagerDashboardData(user.id)

  const atRisk = journeys.filter((j: any) => j.risk_score > 60).length

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '24px' }}>My Team</h1>
      <div className="hc-kpis">
        <KPICard value={journeys.length} label="Active Hires" colorClass="cyan" />
        <KPICard value={upcomingCheckIns.length} label="Upcoming Check-ins" colorClass="blue" />
        <KPICard value={atRisk} label="At Risk" colorClass="red" />
      </div>
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', marginBottom: '16px' }}>Team Members</h2>
        <div className="hc-employees">
          {journeys.length === 0 ? (
            <p style={{ padding: '20px', color: 'var(--text3)', textAlign: 'center' }}>No assigned new hires yet.</p>
          ) : (
            journeys.map((j: any) => <TeamCard key={j.id} journey={j} />)
          )}
        </div>
      </div>
      {upcomingCheckIns.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', marginBottom: '16px' }}>Upcoming Check-ins</h2>
          {upcomingCheckIns.map((ci: any) => (
            <div key={ci.id} className="hc-emp">
              <i className="fa-solid fa-calendar-check" style={{ color: 'var(--blue)', fontSize: '1.2rem', width: '26px', textAlign: 'center' }}></i>
              <div className="hce-info">
                <strong>{ci.milestone.replace('_', ' ').replace('day', 'Day ')} Check-in</strong>
                <span>{new Date(ci.scheduled_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
