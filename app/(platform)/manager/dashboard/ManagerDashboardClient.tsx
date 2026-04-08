'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import TeamCard from '@/components/platform/TeamCard'
import KPICard from '@/components/platform/KPICard'
import ProgressRing from '@/components/platform/ProgressRing'
import IntegrationMetrics from '@/components/platform/IntegrationMetrics'
import ManagerNotes from '@/components/platform/ManagerNotes'
import MilestonesList from '@/components/platform/MilestonesList'
import FrictionMap, { FrictionPoint } from '@/components/platform/FrictionMap'
import IntegrationRadar from '@/components/platform/IntegrationRadar'
import ManagerPendingTasks from '@/components/platform/ManagerPendingTasks'
import TeamSentiment from '@/components/platform/TeamSentiment'
import CoachingHub from '@/components/platform/CoachingHub'
import InterventionBrief from '@/components/platform/InterventionBrief'
import ScheduleCheckInModal from '@/components/platform/ScheduleCheckInModal'

interface ManagerDashboardClientProps {
  user: any
  journeys: any[]
  activeJourney: any
  upcomingCheckIns: any[]
  frictionPoints: FrictionPoint[]
  mockIntegrationMetrics: any[]
  overallProgress: number
  atRiskCount: number
}

export default function ManagerDashboardClient({
  journeys,
  activeJourney,
  upcomingCheckIns,
  frictionPoints,
  mockIntegrationMetrics,
  overallProgress,
  atRiskCount,
}: ManagerDashboardClientProps) {
  const [selectedPoint, setSelectedPoint] = useState<FrictionPoint | null>(null)
  const [showCheckIn, setShowCheckIn] = useState(false)

  return (
    <>
      <header className="db-header">
        <div className="db-header-left">
          <h1>Manager Overview</h1>
          <p>Monitor your team's integration progress and upcoming milestones.</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-primary btn-sm btn-glow" onClick={() => setShowCheckIn(true)}>
            <i className="fa-solid fa-calendar-day" /> Schedule Check-in
          </button>
        </div>
      </header>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* Row 1 — KPIs */}
        <div className="kpi-row">
          <KPICard value={journeys.length}        label="Active Hires"      colorClass="cyan"  icon="fa-solid fa-user-group" />
          <KPICard value={upcomingCheckIns.length} label="Pending Check-ins" colorClass="blue"  icon="fa-solid fa-calendar-check" />
          <KPICard value={atRiskCount}             label="At Risk"           colorClass="red"   icon="fa-solid fa-triangle-exclamation" />
          <KPICard value="4.8/5"                   label="Team Feedback"     colorClass="green" icon="fa-solid fa-face-smile" />
        </div>

        {/* Row 2 — Main 2/3 + Side 1/3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-standard)', alignItems: 'start' }}>

          {/* Main column */}
          <div className="db-col-main">

            {/* Team integration status */}
            <div className="db-card">
              <div className="db-card-hd">
                <h3><i className="fa-solid fa-users" style={{ color: 'var(--blue)' }} /> Team Integration Status</h3>
                <span className="badge-ai">Live Pulse</span>
              </div>
              <div className="db-card-bd">
                {journeys.length === 0 ? (
                  <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>No assigned new hires yet.</p>
                ) : (
                  journeys.map((j: any) => <TeamCard key={j.id} journey={j} />)
                )}
              </div>
            </div>

            <ManagerPendingTasks />

            {activeJourney && (
              <div onClick={(e: any) => {
                const pointId = e.target.closest('.fm-point-group-max')?.id
                if (pointId) {
                  const point = frictionPoints.find(p => p.id === pointId)
                  if (point) setSelectedPoint(point)
                }
              }}>
                <FrictionMap points={frictionPoints} startDate={activeJourney.start_date} />
              </div>
            )}

            <CoachingHub />
          </div>

          {/* Side column */}
          <div className="db-col-side">

            {/* Progress ring card */}
            <div className="db-card">
              <div className="db-card-hd">
                <h3><i className="fa-solid fa-chart-line" style={{ color: 'var(--blue)' }} /> Onboarding Progress</h3>
                <span className="badge-ai">Predictive</span>
              </div>
              <div className="db-card-bd" style={{ display: 'flex', justifyContent: 'center', padding: '24px 20px' }}>
                <ProgressRing percentage={overallProgress} label="Average Vitality" />
              </div>
            </div>

            <TeamSentiment />
            <IntegrationMetrics metrics={mockIntegrationMetrics} />
            <IntegrationRadar />
            <MilestonesList />
            <ManagerNotes />
          </div>
        </div>

      </div>

      {selectedPoint && (
        <InterventionBrief point={selectedPoint} onClose={() => setSelectedPoint(null)} />
      )}

      <AnimatePresence>
        {showCheckIn && (
          <ScheduleCheckInModal onClose={() => setShowCheckIn(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
