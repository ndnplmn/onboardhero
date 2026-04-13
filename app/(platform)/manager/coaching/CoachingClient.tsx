'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const CheckInAgenda = dynamic(() => import('@/components/ai/CheckInAgenda'), { ssr: false })
const LeadershipSimulation = dynamic(() => import('@/components/ai/LeadershipSimulation'), { ssr: false })

interface TeamMember {
  journeyId: string
  employeeId: string
  name: string
  department: string
  status: string
  currentWeek: number
  riskScore: number
  sentimentScore: number
  progress: number
  completedTasks: number
  totalTasks: number
}

const MOCK_MEMBERS: TeamMember[] = [
  { journeyId: 'j1', employeeId: 'e1', name: 'Jordan Rivera', department: 'Engineering', status: 'in_progress', currentWeek: 3, riskScore: 25, sentimentScore: 78, progress: 60, completedTasks: 9, totalTasks: 15 },
  { journeyId: 'j2', employeeId: 'e2', name: 'Sam Chen', department: 'Design', status: 'at_risk', currentWeek: 2, riskScore: 72, sentimentScore: 42, progress: 30, completedTasks: 4, totalTasks: 13 },
  { journeyId: 'j3', employeeId: 'e3', name: 'Alex Morgan', department: 'Product', status: 'in_progress', currentWeek: 6, riskScore: 18, sentimentScore: 88, progress: 80, completedTasks: 12, totalTasks: 15 },
]

export default function CoachingClient({ teamMembers: raw }: { teamMembers: TeamMember[] }) {
  const teamMembers = raw.length > 0 ? raw : MOCK_MEMBERS
  const [coachTarget, setCoachTarget] = useState<TeamMember | null>(null)
  const [simulationTarget, setSimulationTarget] = useState<TeamMember | null>(null)
  const [showGeneralCoach, setShowGeneralCoach] = useState(false)

  const atRisk = teamMembers.filter(m => m.riskScore >= 70).length
  const avgProgress = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((s, m) => s + m.progress, 0) / teamMembers.length)
    : 0
  const avgSentiment = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((s, m) => s + (m.sentimentScore || 0), 0) / teamMembers.length)
    : 0

  function getRiskColor(score: number) {
    if (score >= 70) return 'var(--red)'
    if (score >= 40) return 'var(--amber)'
    return 'var(--green)'
  }

  function getRiskBadge(score: number) {
    if (score >= 70) return <span className="badge-risk">High Risk</span>
    if (score >= 40) return <span className="badge-warn">Medium</span>
    return <span className="badge-on">On Track</span>
  }

  return (
    <>
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i className="fa-solid fa-user-tie" style={{ marginRight: 8, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
            AI Coach
          </h1>
          <p>Prepare for check-ins, get coaching tips, and manage your team&apos;s onboarding.</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-primary" onClick={() => setShowGeneralCoach(true)}>
            <i className="fa-solid fa-comments" style={{ marginRight: 6 }} />
            Open Coach
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPIs */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-users" /></div>
            <div className="kpi-value">{teamMembers.length}</div>
            <div className="kpi-label">Team Members</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon red"><i className="fa-solid fa-triangle-exclamation" /></div>
            <div className="kpi-value">{atRisk}</div>
            <div className="kpi-label">At Risk</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-chart-line" /></div>
            <div className="kpi-value">{avgProgress}%</div>
            <div className="kpi-label">Avg Progress</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-face-smile" /></div>
            <div className="kpi-value">{avgSentiment}</div>
            <div className="kpi-label">Avg Sentiment</div>
          </div>
        </div>

        {/* Team member cards */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3>
              <i className="fa-solid fa-user-group" style={{ color: 'var(--blue)' }} />
              Your Team
            </h3>
          </div>
          <div className="db-card-bd">
            {teamMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
                <i className="fa-solid fa-users" style={{ fontSize: '2rem', marginBottom: 12, display: 'block' }} />
                <p>No active team members found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {teamMembers.map((member) => (
                  <div
                    key={member.journeyId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px',
                      background: 'var(--surface2)',
                      border: `1px solid ${member.riskScore >= 70 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-lg)',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'var(--grad)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <i className="fa-solid fa-user" style={{ fontSize: 14, color: '#fff' }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 14, fontWeight: 700 }}>{member.name}</strong>
                        {getRiskBadge(member.riskScore)}
                      </div>
                      <div style={{ display: 'flex', gap: 16, color: 'var(--text3)', fontSize: 12, marginBottom: 8 }}>
                        <span><i className="fa-solid fa-building" style={{ marginRight: 4 }} />{member.department}</span>
                        <span><i className="fa-solid fa-calendar-week" style={{ marginRight: 4 }} />Week {member.currentWeek}</span>
                        <span><i className="fa-solid fa-list-check" style={{ marginRight: 4 }} />{member.completedTasks}/{member.totalTasks} tasks</span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{
                          width: `${member.progress}%`,
                          height: '100%',
                          background: member.riskScore >= 70 ? 'var(--red)' : member.riskScore >= 40 ? 'var(--amber)' : 'var(--grad)',
                          borderRadius: 100,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>

                    {/* Sentiment */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 800,
                        fontFamily: 'var(--font-display)',
                        color: member.sentimentScore >= 70 ? 'var(--green)' : member.sentimentScore >= 40 ? 'var(--amber)' : 'var(--red)',
                      }}>
                        {member.sentimentScore ?? '—'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>Sentiment</div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setCoachTarget(member)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <i className="fa-solid fa-clipboard-list" style={{ marginRight: 5 }} />
                        Coach
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setSimulationTarget(member)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <i className="fa-solid fa-person-running" style={{ marginRight: 5 }} />
                        Simulate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {coachTarget && (
        <CheckInAgenda
          onClose={() => setCoachTarget(null)}
          employeeName={coachTarget.name}
          journeyId={coachTarget.journeyId}
        />
      )}

      {simulationTarget && (
        <LeadershipSimulation
          onClose={() => setSimulationTarget(null)}
          employeeData={{
            id: simulationTarget.employeeId,
            name: simulationTarget.name,
            role: simulationTarget.department,
            riskScore: simulationTarget.riskScore,
            sentimentScore: simulationTarget.sentimentScore,
            blockers: [],
          }}
        />
      )}

      {showGeneralCoach && (
        <CheckInAgenda onClose={() => setShowGeneralCoach(false)} />
      )}
    </>
  )
}
