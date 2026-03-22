import { getHRDashboardData } from '@/lib/db/queries/dashboard'
import KPICard from '@/components/platform/KPICard'
import EmployeeList from '@/components/platform/EmployeeList'

export const dynamic = 'force-dynamic'

export default async function HRDashboard() {
  const { journeys, tasks } = await getHRDashboardData()

  const activeJourneys = journeys.filter((j: any) => j.status !== 'completed')
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
  const atRisk = journeys.filter((j: any) => j.risk_score > 60).length
  const onTrack = activeJourneys.length > 0
    ? Math.round((activeJourneys.filter((j: any) => j.risk_score <= 30).length / activeJourneys.length) * 100)
    : 100

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '24px' }}>HR Dashboard</h1>
      <div className="hc-kpis">
        <KPICard value={activeJourneys.length} label="Active Journeys" colorClass="cyan" />
        <KPICard value={`${onTrack}%`} label="On Track" colorClass="blue" />
        <KPICard value={completedTasks} label="Tasks Done" colorClass="aqua" />
        <KPICard value={atRisk} label="At Risk" colorClass="red" />
      </div>
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', marginBottom: '16px' }}>Active Journeys</h2>
        <EmployeeList journeys={activeJourneys} />
      </div>
    </div>
  )
}
