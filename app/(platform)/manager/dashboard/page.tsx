import { getUser } from '@/lib/auth/get-user'
import { getManagerDashboardData } from '@/lib/db/queries/manager'
import TeamCard from '@/components/platform/TeamCard'
import KPICard from '@/components/platform/KPICard'
import ProgressRing from '@/components/platform/ProgressRing'
import IntegrationMetrics from '@/components/platform/IntegrationMetrics'
import ManagerNotes from '@/components/platform/ManagerNotes'
import MilestonesList from '@/components/platform/MilestonesList'

export const dynamic = 'force-dynamic'

export default async function ManagerDashboard() {
  const user = await getUser()
  const { journeys, upcomingCheckIns } = await getManagerDashboardData(user.id)

  const atRiskCount = journeys.filter((j: any) => j.risk_score > 60).length
  
  // Mock metrics for high-fidelity parity
  const mockIntegrationMetrics = [
    { label: 'Social Integration', value: 85, icon: 'fa-solid fa-users', color: 'var(--cyan)' },
    { label: 'Technical Ramp-up', value: 72, icon: 'fa-solid fa-laptop-code', color: 'var(--blue)' },
    { label: 'Culture Alignment', value: 94, icon: 'fa-solid fa-heart', color: 'var(--aqua)' }
  ]

  const activeJourney = journeys[0] || null
  const overallProgress = activeJourney ? Math.min(Math.round((activeJourney.current_week / 12) * 100), 100) : 0

  return (
    <div className="app-main">
      <header className="db-header">
        <div>
          <h1>Manager Overview</h1>
          <p>Monitor your team's integration progress and upcoming milestones.</p>
        </div>
        <div className="db-header-actions">
           <button className="btn btn-primary btn-sm"><i className="fa-solid fa-calendar-day"></i> Schedule Check-in</button>
        </div>
      </header>

      <div className="db-body">
        <div className="kpi-row">
          <KPICard 
            value={journeys.length} 
            label="Active Hires" 
            colorClass="cyan" 
            icon="fa-solid fa-user-group"
          />
          <KPICard 
            value={upcomingCheckIns.length} 
            label="Pending Check-ins" 
            colorClass="blue" 
            icon="fa-solid fa-calendar-check"
          />
          <KPICard 
            value={atRiskCount} 
            label="At Risk" 
            colorClass="red" 
            icon="fa-solid fa-triangle-exclamation"
          />
          <KPICard 
            value="4.8/5" 
            label="Team Feedback" 
            colorClass="green" 
            icon="fa-solid fa-face-smile"
          />
        </div>

        <div className="db-row col3">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="db-card">
              <div className="db-card-hd">
                <h3><i className="fa-solid fa-users" style={{ color: 'var(--blue)', marginRight: '6px' }}></i> Team Integration Status</h3>
              </div>
              <div className="db-card-bd">
                {journeys.length === 0 ? (
                  <p style={{ padding: '20px', color: 'var(--text3)', textAlign: 'center' }}>No assigned new hires yet.</p>
                ) : (
                  journeys.map((j: any) => <TeamCard key={j.id} journey={j} />)
                )}
              </div>
            </div>
            
            <ManagerNotes />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="db-card">
              <div className="db-card-hd">
                <h3><i className="fa-solid fa-chart-line" style={{ color: 'var(--blue)', marginRight: '6px' }}></i> Overall Team Progress</h3>
              </div>
              <div className="db-card-bd" style={{ padding: '30px 20px' }}>
                <ProgressRing percentage={overallProgress} label="Avg. Velocity" />
              </div>
            </div>

            <IntegrationMetrics metrics={mockIntegrationMetrics} />
            <MilestonesList />
          </div>
        </div>
      </div>
    </div>
  )
}

