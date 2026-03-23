'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const CheckInAgenda = dynamic(() => import('@/components/ai/CheckInAgenda'), { ssr: false })

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

export default function CoachingClient({ teamMembers }: { teamMembers: TeamMember[] }) {
  const [coachTarget, setCoachTarget] = useState<TeamMember | null>(null)
  const [showGeneralCoach, setShowGeneralCoach] = useState(false)

  function getRiskBadge(score: number) {
    if (score >= 70) return <span className="badge-risk">High Risk</span>
    if (score >= 40) return <span className="badge-warn">Medium Risk</span>
    return <span className="badge-on">On Track</span>
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>
            <i className="fa-solid fa-user-tie" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>
            AI Coach
          </h1>
          <p style={{ color: 'var(--text3)' }}>
            Prepare for check-ins, get coaching tips, and manage your team&apos;s onboarding.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowGeneralCoach(true)}>
          <i className="fa-solid fa-comments" style={{ marginRight: '6px' }}></i>
          Open Coach
        </button>
      </div>

      {teamMembers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <i className="fa-solid fa-users" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }}></i>
          <p>No active team members found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {teamMembers.map((member) => (
            <div
              key={member.journeyId}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: member.riskScore >= 70 ? '1px solid var(--red, #ef5350)' : undefined,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '1.05rem' }}>{member.name}</strong>
                  {getRiskBadge(member.riskScore)}
                </div>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text3)', fontSize: '0.85rem', marginBottom: '10px' }}>
                  <span>{member.department}</span>
                  <span>Week {member.currentWeek}</span>
                  <span>{member.completedTasks}/{member.totalTasks} tasks</span>
                </div>
                <div style={{ background: 'var(--bg2, #f0f0f0)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${member.progress}%`,
                      height: '100%',
                      background: member.riskScore >= 70 ? 'var(--red, #ef5350)' : member.riskScore >= 40 ? 'var(--amber, #ffa726)' : 'var(--green, #66bb6a)',
                      borderRadius: '4px',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setCoachTarget(member)}
                style={{ whiteSpace: 'nowrap' }}
              >
                <i className="fa-solid fa-clipboard-list" style={{ marginRight: '6px' }}></i>
                Get Coaching
              </button>
            </div>
          ))}
        </div>
      )}

      {coachTarget && (
        <CheckInAgenda
          onClose={() => setCoachTarget(null)}
          employeeName={coachTarget.name}
          journeyId={coachTarget.journeyId}
        />
      )}

      {showGeneralCoach && (
        <CheckInAgenda onClose={() => setShowGeneralCoach(false)} />
      )}
    </div>
  )
}
