'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useT } from '@/lib/i18n/context'

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
  lastPulse?: number | null
  frictionPoints?: string[]
  pulseHistory?: { week: number; score: number }[]
}

function PulseSparkline({ data }: { data: { week: number; score: number }[] }) {
  if (data.length < 2) return null
  const W = 72, H = 28, pad = 3
  const scores = data.map(d => d.score)
  const min = 1, max = 5
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (W - pad * 2))
  const ys = scores.map(s => H - pad - ((s - min) / (max - min)) * (H - pad * 2))
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const last = scores[scores.length - 1]
  const prev = scores[scores.length - 2]
  const color = last >= prev ? '#22c55e' : last < 3 ? '#ef4444' : '#f59e0b'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={`Pulse trend (${data.length} weeks)`}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={2.5} fill={color} />
      </svg>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{last}/5</span>
    </div>
  )
}

interface CoachingNote {
  id: string
  content: string
  source: string
  created_at: string
}

function AiBrief({ member }: { member: TeamMember }) {
  const [open, setOpen] = useState(false)
  const [bullets, setBullets] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const fetched = useState(false)
  const [draftOpen, setDraftOpen] = useState(false)
  const [draftMsg, setDraftMsg] = useState<string | null>(null)
  const [draftLoading, setDraftLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleOpen() {
    const next = !open
    setOpen(next)
    if (next && !fetched[0]) {
      fetched[1](true)
      setLoading(true)
      try {
        const res = await fetch('/api/coaching-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:           member.name,
            riskScore:      member.riskScore,
            sentimentScore: member.sentimentScore,
            progress:       member.progress,
            currentWeek:    member.currentWeek,
            lastPulse:      member.lastPulse,
            frictionPoints: member.frictionPoints,
            pendingTasks:   member.totalTasks - member.completedTasks,
          }),
        })
        const data = await res.json()
        if (data.bullets) setBullets(data.bullets)
      } catch {
        setBullets([`${member.name.split(' ')[0]}: AI brief unavailable.`])
      } finally {
        setLoading(false)
      }
    }
  }

  async function fetchDraft() {
    setDraftLoading(true)
    try {
      const res = await fetch('/api/draft-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hireName:       member.name,
          riskScore:      member.riskScore,
          currentWeek:    member.currentWeek,
          lastPulse:      member.lastPulse,
          frictionPoints: member.frictionPoints,
          pendingTasks:   member.totalTasks - member.completedTasks,
        }),
      })
      const data = await res.json()
      setDraftMsg(data.message ?? 'AI message unavailable.')
    } catch {
      setDraftMsg('AI message unavailable. Try again.')
    } finally {
      setDraftLoading(false)
    }
  }

  function handleDraft() {
    if (!draftOpen) { setDraftOpen(true); if (!draftMsg) fetchDraft(); return }
    setDraftOpen(false)
  }

  function handleRegenerate() {
    setDraftMsg(null)
    setDraftOpen(true)
    fetchDraft()
  }

  function copyToClipboard() {
    if (!draftMsg) return
    navigator.clipboard.writeText(draftMsg).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Trigger row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={handleOpen}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
            background: open ? 'color-mix(in srgb, var(--blue) 12%, transparent)' : 'var(--surface)',
            color: open ? 'var(--blue)' : 'var(--text3)',
            border: `1px solid ${open ? 'color-mix(in srgb, var(--blue) 25%, transparent)' : 'var(--border)'}`,
            cursor: 'pointer',
          }}
        >
          <i className={`fa-solid fa-${loading ? 'spinner fa-spin' : 'brain'}`} style={{ fontSize: 9 }} />
          AI Brief
          <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 8 }} />
        </button>

        <button
          onClick={handleDraft}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
            background: draftOpen ? 'color-mix(in srgb, var(--violet) 12%, transparent)' : 'var(--surface)',
            color: draftOpen ? 'var(--violet)' : 'var(--text3)',
            border: `1px solid ${draftOpen ? 'color-mix(in srgb, var(--violet) 25%, transparent)' : 'var(--border)'}`,
            cursor: 'pointer',
          }}
        >
          <i className={`fa-solid fa-${draftLoading ? 'spinner fa-spin' : 'paper-plane'}`} style={{ fontSize: 9 }} />
          Draft Message
        </button>
      </div>

      {/* AI Brief panel */}
      {open && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--r)', borderLeft: '3px solid var(--blue)',
        }}>
          {loading ? (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }} />
              Generating insight…
            </span>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 16, listStyleType: 'disc' }}>
              {(bullets ?? []).map((b, i) => (
                <li key={i} style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Draft Message panel */}
      {draftOpen && (
        <div style={{
          padding: '12px 14px',
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 'var(--r)', borderLeft: '3px solid var(--violet)',
        }}>
          {draftLoading ? (
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }} />
              Drafting message…
            </span>
          ) : (
            <>
              <textarea
                value={draftMsg ?? ''}
                onChange={e => setDraftMsg(e.target.value)}
                rows={5}
                style={{
                  width: '100%', fontSize: 12, color: 'var(--text2)', lineHeight: 1.65,
                  background: 'transparent', border: 'none', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit', padding: 0,
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 100,
                    background: copied ? 'color-mix(in srgb, var(--green) 15%, transparent)' : 'var(--surface)',
                    color: copied ? 'var(--green)' : 'var(--text3)',
                    border: `1px solid ${copied ? 'color-mix(in srgb, var(--green) 25%, transparent)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <i className={`fa-solid fa-${copied ? 'check' : 'copy'}`} style={{ fontSize: 9 }} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <a
                  href={`mailto:?subject=${encodeURIComponent(`Check-in: ${member.name} — Week ${member.currentWeek}`)}&body=${encodeURIComponent(draftMsg ?? '')}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 100,
                    background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
                    color: 'var(--blue)',
                    border: '1px solid color-mix(in srgb, var(--blue) 22%, transparent)',
                    textDecoration: 'none', cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-envelope" style={{ fontSize: 9 }} />
                  Send via Email
                </a>
                <button
                  onClick={handleRegenerate}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 100,
                    background: 'var(--surface)', color: 'var(--text3)',
                    border: '1px solid var(--border)', cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-rotate" style={{ fontSize: 9 }} />
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const SOURCE_LABEL: Record<string, string> = {
  manual:  'Manual',
  roleplay: 'Roleplay',
  ai:      'AI',
}

function CoachingNotesViewer({ notes }: { notes: CoachingNote[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (notes.length === 0) return null

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-notebook" style={{ color: 'var(--violet)' }} />
          My Coaching Notes
        </h3>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{notes.length} saved</span>
      </div>
      <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {notes.map(note => {
          const isOpen = expanded === note.id
          const preview = note.content.slice(0, 100) + (note.content.length > 100 ? '…' : '')
          return (
            <div
              key={note.id}
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : note.id)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', padding: '10px 14px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}
              >
                <i className="fa-solid fa-quote-left" style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                    {isOpen ? note.content : preview}
                  </p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>{timeAgo(note.created_at)}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 100,
                      background: 'color-mix(in srgb, var(--violet) 12%, transparent)',
                      color: 'var(--violet)',
                    }}>
                      {SOURCE_LABEL[note.source] ?? note.source}
                    </span>
                  </div>
                </div>
                <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, marginTop: 4 }} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CoachingClient({ teamMembers, coachingNotes = [] }: { teamMembers: TeamMember[]; coachingNotes?: CoachingNote[] }) {
  const { t } = useT()
  const searchParams = useSearchParams()
  const [coachTarget, setCoachTarget] = useState<TeamMember | null>(null)
  const [simulationTarget, setSimulationTarget] = useState<TeamMember | null>(null)
  const [showGeneralCoach, setShowGeneralCoach] = useState(false)

  // Auto-open simulation modal when ?focus=journeyId is present
  useEffect(() => {
    const focusId = searchParams.get('focus')
    if (focusId) {
      const member = teamMembers.find(m => m.journeyId === focusId)
      if (member) setSimulationTarget(member)
    }
  }, [searchParams, teamMembers])

  const atRisk = teamMembers.filter(m => m.riskScore >= 70).length
  const avgProgress = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((s, m) => s + m.progress, 0) / teamMembers.length)
    : 0
  const avgSentiment = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((s, m) => s + (m.sentimentScore || 0), 0) / teamMembers.length)
    : 0

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
            {t('manager.coaching.title')}
          </h1>
          <p>{t('manager.coaching.subtitle')}</p>
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
            <div className="kpi-label">{t('manager.coaching.riskScore')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-chart-line" /></div>
            <div className="kpi-value">{avgProgress}%</div>
            <div className="kpi-label">{t('manager.coaching.progress')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-face-smile" /></div>
            <div className="kpi-value">{avgSentiment}</div>
            <div className="kpi-label">{t('manager.coaching.sentiment')}</div>
          </div>
        </div>

        {/* Saved coaching notes */}
        <CoachingNotesViewer notes={coachingNotes} />

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
                <p>{t('manager.coaching.noHires')}</p>
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
                      {/* Progress bar + pulse sparkline */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{
                            width: `${member.progress}%`,
                            height: '100%',
                            background: member.riskScore >= 70 ? 'var(--red)' : member.riskScore >= 40 ? 'var(--amber)' : 'var(--grad)',
                            borderRadius: 100,
                            transition: 'width 0.3s',
                          }} />
                        </div>
                        {member.pulseHistory && member.pulseHistory.length >= 2 && (
                          <PulseSparkline data={member.pulseHistory} />
                        )}
                      </div>
                      <AiBrief member={member} />
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
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>{t('manager.coaching.sentiment')}</div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setCoachTarget(member)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <i className="fa-solid fa-clipboard-list" style={{ marginRight: 5 }} />
                        {t('manager.coaching.coach')}
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
