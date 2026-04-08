'use client'

import React from 'react'
import AuraAssistant from '@/components/platform/AuraAssistant'
import GlobalFrictionMap from '@/components/platform/GlobalFrictionMap'
import CulturalResonance from '@/components/platform/CulturalResonance'
import TalentVelocity from '@/components/platform/TalentVelocity'
import KPICard from '@/components/platform/KPICard'

interface HRDashboardClientProps {
  initialData: {
    journeys: any[]
    tasks: any[]
  }
  kpis?: {
    totalWorkforce: number
    retentionRate: number
    integrationVelocity: number
    frictionAlerts: number
  }
  analyticsBelt?: React.ReactNode
  mainContent?: React.ReactNode
  sideContent?: React.ReactNode
  bottomContent?: React.ReactNode
}

const DEFAULT_KPIS = {
  totalWorkforce: 1240,
  retentionRate: 94.2,
  integrationVelocity: 88,
  frictionAlerts: 12
}

export default function HRDashboardClient({ initialData, kpis = DEFAULT_KPIS, analyticsBelt, mainContent, sideContent, bottomContent }: HRDashboardClientProps) {
  return (
    <div className="app-main">
      <header className="db-header">
        <div className="db-header-left">
          <h1>Organizational Intelligence</h1>
          <p>Global workforce health and predictive integration analytics.</p>
        </div>
        <div className="db-header-actions">
           <button className="btn btn-outline btn-sm"><i className="fa-solid fa-download"></i> Export Report</button>
           <button className="btn btn-primary btn-sm"><i className="fa-solid fa-plus"></i> New Intervention</button>
        </div>
      </header>
 
      <div className="db-body gap-standard" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
        <div className="kpi-row">
          <KPICard 
             value={kpis.totalWorkforce} 
             label="Total Workforce" 
             colorClass="cyan" 
             icon="fa-solid fa-users-viewfinder"
             trend={{ value: "+4.2%", isDown: false }}
          />
          <KPICard 
             value={`${kpis.retentionRate}%`} 
             label="Retention 90d" 
             colorClass="blue" 
             icon="fa-solid fa-chart-pie"
          />
          <KPICard 
             value={`${kpis.integrationVelocity}%`} 
             label="Sync Velocity" 
             colorClass="aqua" 
             icon="fa-solid fa-bolt-lightning"
             trend={{ value: "Optimized", isDown: false }}
          />
          <KPICard 
             value={kpis.frictionAlerts} 
             label="Friction Alerts" 
             colorClass="red" 
             icon="fa-solid fa-sensor-triangle-exclamation"
             trend={{ value: "Action Needed", isDown: true }}
          />
        </div>

        {/* Distributed Analytics Belt */}
        {analyticsBelt && (
          <div className="analytics-belt">
            {analyticsBelt}
          </div>
        )}
 
        <div className="db-row col3 gap-standard" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-standard)', alignItems: 'start' }}>
          <div className="db-col-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
            <GlobalFrictionMap />
            {mainContent}
          </div>
 
          <div className="db-col-side gap-standard" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
            <CulturalResonance />
            <TalentVelocity />
            {sideContent}
          </div>
        </div>

        {bottomContent && (
          <div className="db-bottom-full">
            {bottomContent}
          </div>
        )}
      </div>
 
      <AuraAssistant role="hr_manager" />
    </div>
  )
}
