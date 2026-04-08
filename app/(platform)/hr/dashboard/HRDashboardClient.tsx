'use client'

import GlobalFrictionMap from '@/components/platform/GlobalFrictionMap'
import CulturalResonance from '@/components/platform/CulturalResonance'
import TalentVelocity from '@/components/platform/TalentVelocity'
import KPICard from '@/components/platform/KPICard'
import EmployeeTable from '@/components/platform/EmployeeTable'
import ActiveAlerts from '@/components/platform/ActiveAlerts'
import StageChecklist from '@/components/platform/StageChecklist'
import JourneyTemplate from '@/components/platform/JourneyTemplate'
import { CompletionRateCard, EngagementScoreCard } from '@/components/platform/AnalyticsSection'

interface HRDashboardClientProps {
  initialData: {
    journeys: any[]
    tasks: any[]
  }
  engagementData: { label: string; value: number }[]
  completionData:  { label: string; value: number }[]
  mockStages:      { label: string; count: number }[]
  kpis?: {
    totalWorkforce:     number
    retentionRate:      number
    integrationVelocity: number
    frictionAlerts:     number
  }
}

const DEFAULT_KPIS = {
  totalWorkforce: 1240,
  retentionRate: 94.2,
  integrationVelocity: 88,
  frictionAlerts: 12,
}

export default function HRDashboardClient({
  engagementData,
  completionData,
  mockStages,
  kpis = DEFAULT_KPIS,
}: HRDashboardClientProps) {
  return (
    <>
      <header className="db-header">
        <div className="db-header-left">
          <h1>HR Dashboard</h1>
          <p>Workforce health · integration analytics · active alerts</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm">
            <i className="fa-solid fa-download" /> Export Report
          </button>
          <button className="btn btn-primary btn-sm btn-glow">
            <i className="fa-solid fa-user-plus" /> Invite New Hire
          </button>
        </div>
      </header>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* Row 1 — KPIs */}
        <div className="kpi-row">
          <KPICard value={kpis.totalWorkforce}          label="Total Workforce"  colorClass="cyan"  icon="fa-solid fa-users"                trend={{ value: '+4.2%',        isDown: false }} />
          <KPICard value={`${kpis.retentionRate}%`}    label="Retention 90d"   colorClass="blue"  icon="fa-solid fa-chart-pie"           />
          <KPICard value={`${kpis.integrationVelocity}%`} label="Sync Velocity" colorClass="aqua"  icon="fa-solid fa-bolt-lightning"      trend={{ value: 'Optimized',     isDown: false }} />
          <KPICard value={kpis.frictionAlerts}          label="Friction Alerts" colorClass="red"   icon="fa-solid fa-triangle-exclamation" trend={{ value: 'Action Needed', isDown: true  }} />
        </div>

        {/* Row 2 — Analytics belt: 3 equal-weight cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap-standard)' }}>
          <CompletionRateCard data={completionData} />
          <EngagementScoreCard data={engagementData} />
          <StageChecklist stages={mockStages} />
        </div>

        {/* Row 3 — Main 2/3 + Side 1/3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-standard)', alignItems: 'start' }}>

          {/* Main column */}
          <div className="db-col-main">
            <GlobalFrictionMap />
            <EmployeeTable />
          </div>

          {/* Side column */}
          <div className="db-col-side">
            <ActiveAlerts />
            <CulturalResonance />
            <TalentVelocity />
          </div>
        </div>

        {/* Row 4 — Full-width bottom */}
        <JourneyTemplate />

      </div>
    </>
  )
}
