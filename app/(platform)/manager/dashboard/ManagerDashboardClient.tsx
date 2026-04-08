'use client'

import React, { useState, Suspense } from 'react'
import TeamCard from '@/components/platform/TeamCard'
import KPICard from '@/components/platform/KPICard'
import ProgressRing from '@/components/platform/ProgressRing'
import IntegrationMetrics from '@/components/platform/IntegrationMetrics'
import ManagerNotes from '@/components/platform/ManagerNotes'
import MilestonesList from '@/components/platform/MilestonesList'
import FrictionMap, { FrictionPoint } from '@/components/platform/FrictionMap'
import IntegrationRadar from '@/components/platform/IntegrationRadar'
import ManagerPendingTasks from '@/components/platform/ManagerPendingTasks'
import AuraAssistant from '@/components/platform/AuraAssistant'
import TeamSentiment from '@/components/platform/TeamSentiment'
import CoachingHub from '@/components/platform/CoachingHub'
import InterventionBrief from '@/components/platform/InterventionBrief'

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
  user,
  journeys,
  activeJourney,
  upcomingCheckIns,
  frictionPoints,
  mockIntegrationMetrics,
  overallProgress,
  atRiskCount
}: ManagerDashboardClientProps) {
  const [selectedPoint, setSelectedPoint] = useState<FrictionPoint | null>(null)

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

      <div className="db-body gap-standard">
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

        <div className="db-row col3 gap-standard">
          <div className="db-col-main">
            <div className="db-card">
              <div className="db-card-hd">
                <h3><i className="fa-solid fa-users" style={{ color: 'var(--blue)' }} /> Team Integration Status</h3>
                <span className="badge-ai">Live Pulse</span>
              </div>
              <div className="db-card-bd">
                {journeys.length === 0 ? (
                  <p style={{ padding: '20px', color: 'var(--text3)', textAlign: 'center' }}>No assigned new hires yet.</p>
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
                <FrictionMap 
                  points={frictionPoints} 
                  startDate={activeJourney.start_date} 
                />
              </div>
            )}
            
            <CoachingHub />
            <ManagerNotes />
          </div>

          <div className="db-col-side gap-standard">
            <div className="db-card">
              <div className="db-card-hd">
                <h3><i className="fa-solid fa-chart-line" style={{ color: 'var(--blue)' }} /> Onboarding Progress</h3>
                <span className="badge-ai">Predictive</span>
              </div>
              <div className="db-card-bd" style={{ padding: '30px 20px' }}>
                <ProgressRing percentage={overallProgress} label="Average Vitality" />
              </div>
            </div>

            <TeamSentiment />
            <IntegrationMetrics metrics={mockIntegrationMetrics} />
            <IntegrationRadar />
            <MilestonesList />
          </div>
        </div>
      </div>

      <AuraAssistant role="manager" />

      {selectedPoint && (
        <InterventionBrief 
          point={selectedPoint} 
          onClose={() => setSelectedPoint(null)} 
        />
      )}

      <style jsx>{`
        .db-body { display: flex; flex-direction: column; }
        .db-col-main, .db-col-side { display: flex; flex-direction: column; }
      `}</style>
    </div>
  )
}
