import { getHRDashboardData } from '@/lib/db/queries/dashboard'
import EmployeeTable from '@/components/platform/EmployeeTable'
import ActiveAlerts from '@/components/platform/ActiveAlerts'
import StageChecklist from '@/components/platform/StageChecklist'
import JourneyTemplate from '@/components/platform/JourneyTemplate'
import { CompletionRateCard, EngagementScoreCard } from '@/components/platform/AnalyticsSection'
import HRDashboardClient from './HRDashboardClient'
 
export const dynamic = 'force-dynamic'
 
export default async function HRDashboard() {
  const { journeys, tasks } = await getHRDashboardData()
 
  const activeJourneys = journeys.filter((j: any) => j.status !== 'completed')
  
  // Mock data for analytics
  const engagementData = [
    { label: 'Mon', value: 85 },
    { label: 'Tue', value: 92 },
    { label: 'Wed', value: 89 },
    { label: 'Thu', value: 94 },
    { label: 'Fri', value: 91 },
  ]
 
  const completionData = [
    { label: 'Product', value: 95 },
    { label: 'Sales', value: 82 },
    { label: 'Eng', value: 88 },
    { label: 'HR', value: 100 },
  ]
 
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
        <div className="db-header-left">
          <h1>HR Management Intelligence</h1>
          <p>Global Organizational Insights • Pinnacle 2026 Edition</p>
        </div>
        <div className="db-header-actions">
           <button className="btn btn-primary btn-glow"><i className="fa-solid fa-user-plus"></i> Invite New Hire</button>
        </div>
      </header>
 
      <HRDashboardClient 
        initialData={{ journeys, tasks }}
        analyticsBelt={
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 'var(--gap-standard)', marginBottom: 'var(--gap-standard)' }}>
            <CompletionRateCard data={completionData} />
            <EngagementScoreCard data={engagementData} />
            <StageChecklist stages={mockStages} />
          </div>
        }
        mainContent={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
            <EmployeeTable />
          </div>
        }
        sideContent={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
            <ActiveAlerts />
          </div>
        }
        bottomContent={
          <div style={{ marginTop: 'var(--gap-standard)' }}>
            <JourneyTemplate />
          </div>
        }
      />
    </div>
  )
}
