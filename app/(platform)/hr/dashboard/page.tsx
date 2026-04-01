import { getHRDashboardData } from '@/lib/db/queries/dashboard'
import KPICard from '@/components/platform/KPICard'
import EmployeeList from '@/components/platform/EmployeeList'
import RiskAlerts from '@/components/platform/RiskAlerts'
import StageChecklist from '@/components/platform/StageChecklist'
import AnalyticsSection from '@/components/platform/AnalyticsSection'

export const dynamic = 'force-dynamic'

export default async function HRDashboard() {
  const { journeys, tasks } = await getHRDashboardData()

  const activeJourneys = journeys.filter((j: any) => j.status !== 'completed')
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
  const atRiskCount = journeys.filter((j: any) => j.risk_score > 60).length
  const onTrackPct = activeJourneys.length > 0
    ? Math.round((activeJourneys.filter((j: any) => j.risk_score <= 30).length / activeJourneys.length) * 100)
    : 100

  // Mock data for restoration parity
  const mockRiskAlerts = journeys
    .filter((j: any) => j.risk_score > 60)
    .map((j: any) => ({
      id: j.id,
      name: j.full_name,
      avatar: j.avatar_url || `https://i.pravatar.cc/150?u=${j.id}`,
      issue: 'Integration risk: Low engagement in Week 1 tasks.',
      level: j.risk_score > 80 ? 'high' : 'mid' as 'high' | 'mid'
    }))

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
          <div className="db-card">
            <div className="db-card-hd">
              <h3><i className="fa-solid fa-route" style={{ color: 'var(--blue)', marginRight: '6px' }}></i> Active Onboarding Journeys</h3>
            </div>
            <div className="db-card-bd">
              <EmployeeList journeys={activeJourneys} />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <RiskAlerts alerts={mockRiskAlerts} />
            <StageChecklist stages={mockStages} />
          </div>
        </div>

        <AnalyticsSection />
      </div>
    </div>
  )
}

