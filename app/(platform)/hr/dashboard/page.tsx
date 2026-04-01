import { getHRDashboardData } from '@/lib/db/queries/dashboard'
import KPICard from '@/components/platform/KPICard'
import EmployeeTable from '@/components/platform/EmployeeTable'
import ActiveAlerts from '@/components/platform/ActiveAlerts'
import StageChecklist from '@/components/platform/StageChecklist'
import AnalyticsSection from '@/components/platform/AnalyticsSection'
import JourneyTemplate from '@/components/platform/JourneyTemplate'

export const dynamic = 'force-dynamic'

export default async function HRDashboard() {
  const { journeys, tasks } = await getHRDashboardData()

  const activeJourneys = journeys.filter((j: any) => j.status !== 'completed')
  const atRiskCount = journeys.filter((j: any) => j.risk_score > 60).length
  const onTrackPct = activeJourneys.length > 0
    ? Math.round((activeJourneys.filter((j: any) => j.risk_score <= 30).length / activeJourneys.length) * 100)
    : 100

  // Mock stages for summary
  const mockStages = [
    { label: 'Pre-boarding', count: 12 },
    { label: 'First Week', count: activeJourneys.length },
    { label: 'First Month', count: 5 },
    { label: 'Ramp-up', count: 2 }
  ]

  return (
    <div className="app-main">
      <header className="db-header">
        <div>
          <h1>HR Management Console</h1>
          <p>Real-time overview of all active onboarding journeys across the organization.</p>
        </div>
        <div className="db-header-actions">
           <button className="btn btn-primary btn-sm"><i className="fa-solid fa-user-plus"></i> Invite New Hire</button>
        </div>
      </header>

      <div className="db-body">
        <div className="kpi-row">
          <KPICard 
            value={journeys.length} 
            label="Total Employees" 
            colorClass="cyan" 
            icon="fa-solid fa-users"
            trend={{ value: '+12% this month' }}
          />
          <KPICard 
            value="98.2%" 
            label="Retention Rate" 
            colorClass="blue" 
            icon="fa-solid fa-shield-heart"
          />
          <KPICard 
            value={`${onTrackPct}%`} 
            label="Avg. Completion" 
            colorClass="aqua" 
            icon="fa-solid fa-circle-check"
            trend={{ value: '+5.4%' }}
          />
          <KPICard 
            value={atRiskCount} 
            label="At Risk" 
            colorClass="red" 
            icon="fa-solid fa-triangle-exclamation"
            trend={{ value: 'Needs attention', isDown: true }}
          />
        </div>

        <div className="db-row col3">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <EmployeeTable />
            <JourneyTemplate />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ActiveAlerts />
            <StageChecklist stages={mockStages} />
          </div>
        </div>

        <AnalyticsSection />
      </div>
    </div>
  )
}

