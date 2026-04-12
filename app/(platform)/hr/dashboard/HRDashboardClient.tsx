'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GlobalFrictionMap from '@/components/platform/GlobalFrictionMap'
import CulturalResonance from '@/components/platform/CulturalResonance'
import TalentVelocity from '@/components/platform/TalentVelocity'
import EmployeeTable from '@/components/platform/EmployeeTable'
import ActiveAlerts from '@/components/platform/ActiveAlerts'
import StageChecklist from '@/components/platform/StageChecklist'
import JourneyTemplate from '@/components/platform/JourneyTemplate'
import { CompletionRateCard, EngagementScoreCard } from '@/components/platform/AnalyticsSection'
import InviteUserModal from '@/components/platform/InviteUserModal'
import { AnimatePresence } from 'framer-motion'

interface HRDashboardClientProps {
  journeys: any[]
  kpis: {
    totalWorkforce:     number
    newHires:           number
    activeJourneys:     number
    completedJourneys:  number
    atRisk:             number
    taskCompletionPct:  number
  }
  engagementData:  { label: string; value: number }[]
  completionData:  { label: string; value: number }[]
  stages:          { label: string; count: number }[]
  managers?:       { id: string; full_name: string }[]
  templates?:      { id: string; name: string }[]
}

const DEFAULT_MANAGERS = [
  { id: 'm1', full_name: 'Alex Johnson' },
  { id: 'm2', full_name: 'Maria Garcia' },
  { id: 'm3', full_name: 'Tom Williams' },
]

const DEFAULT_TEMPLATES = [
  { id: 't1', name: '90-Day Standard' },
  { id: 't2', name: 'Engineering Fast-Track' },
  { id: 't3', name: 'Sales Enablement' },
]

function exportReportCSV(journeys: any[]) {
  const header = ['Name', 'Department', 'Week', 'Risk Score', 'Status', 'Start Date']
  const rows = journeys.map(j => [
    j.employee?.full_name ?? 'Unknown',
    j.employee?.department ?? '—',
    j.current_week ?? 0,
    j.risk_score ?? 0,
    j.status ?? '—',
    j.start_date ?? '—',
  ])
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `onboarding-report-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function HRDashboardClient({
  journeys,
  kpis,
  engagementData,
  completionData,
  stages,
  managers  = DEFAULT_MANAGERS,
  templates = DEFAULT_TEMPLATES,
}: HRDashboardClientProps) {
  const router     = useRouter()
  const [showInvite, setShowInvite] = useState(false)

  return (
    <>
      <header className="db-header">
        <div className="db-header-left">
          <h1>HR Dashboard</h1>
          <p>Workforce health · integration analytics · active alerts</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => exportReportCSV(journeys)}>
            <i className="fa-solid fa-download" /> Export Report
          </button>
          <button className="btn btn-primary btn-sm btn-glow" onClick={() => setShowInvite(true)}>
            <i className="fa-solid fa-user-plus" /> Invite New Hire
          </button>
        </div>
      </header>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* Row 1 — KPIs */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-users" /></div>
            <div className="kpi-value">{kpis.totalWorkforce.toLocaleString()}</div>
            <div className="kpi-label">Total Workforce</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-user-tie" /></div>
            <div className="kpi-value">{kpis.newHires}</div>
            <div className="kpi-label">Active New Hires</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-circle-check" /></div>
            <div className="kpi-value">{kpis.completedJourneys}</div>
            <div className="kpi-label">Completed Journeys</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon amber"><i className="fa-solid fa-triangle-exclamation" /></div>
            <div className="kpi-value">{kpis.atRisk}</div>
            <div className="kpi-label">At-Risk Employees</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon aqua"><i className="fa-solid fa-list-check" /></div>
            <div className="kpi-value">{kpis.taskCompletionPct}%</div>
            <div className="kpi-label">Task Completion</div>
          </div>
        </div>

        {/* Row 2 — Analytics belt: 3 equal-weight cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gap-standard)' }}>
          <CompletionRateCard data={completionData} />
          <EngagementScoreCard data={engagementData} />
          <StageChecklist stages={stages} />
        </div>

        {/* Row 3 — Main 2/3 + Side 1/3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-standard)', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
            <GlobalFrictionMap />
            <EmployeeTable onInviteNew={() => setShowInvite(true)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
            <ActiveAlerts onScheduleCheckIn={() => router.push('/hr/alerts')} onInviteNew={() => setShowInvite(true)} />
            <CulturalResonance />
            <TalentVelocity />
          </div>
        </div>

        {/* Row 4 — Full-width bottom */}
        <JourneyTemplate />

      </div>

      <AnimatePresence>
        {showInvite && (
          <InviteUserModal
            managers={managers}
            templates={templates}
            onClose={() => setShowInvite(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
