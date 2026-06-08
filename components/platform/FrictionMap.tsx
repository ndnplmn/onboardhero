'use client'

import { useState, useTransition } from 'react'
import { resolveFrictionPoint, resolveHireFrictionPoint } from '@/app/(platform)/hire/actions'

export interface FrictionPoint {
  id: string
  type: 'technical' | 'culture' | 'engagement' | 'role_clarity' | 'mentorship'
  severity: 'low' | 'medium' | 'high'
  label: string
  description: string
  day: number
  intervention: string
  status?: string
  resolvedBy?: string
}

interface FrictionMapProps {
  points: FrictionPoint[]
  startDate: string
  journeyId?: string
  managerName?: string
}

const PHASES = [
  { label: 'Week 1',  start: 0,  end: 7   },
  { label: 'Month 1', start: 7,  end: 30  },
  { label: 'Month 2', start: 30, end: 60  },
  { label: 'Month 3', start: 60, end: 90  },
]

const SEV_CONFIG = {
  low:    { color: 'var(--green)', bg: 'var(--green-bg)', border: 'rgba(34,197,94,0.25)',  label: 'Positive',    icon: 'fa-solid fa-circle-check' },
  medium: { color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'rgba(245,158,11,0.25)', label: 'Watch',       icon: 'fa-solid fa-triangle-exclamation' },
  high:   { color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'rgba(239,68,68,0.25)',  label: 'Action Needed', icon: 'fa-solid fa-circle-xmark' },
}

const TYPE_ICON: Record<string, string> = {
  technical:   'fa-solid fa-laptop-code',
  culture:     'fa-solid fa-users',
  engagement:  'fa-solid fa-bolt',
  role_clarity:'fa-solid fa-compass',
  mentorship:  'fa-solid fa-handshake-angle',
}

const JOURNEY_DAYS = 90

const HELP_LINK: Record<string, string> = {
  technical:   '/hire/resources/it-setup',
  culture:     '/hire/resources/culture-guide',
  engagement:  '/hire/support',
  role_clarity:'/hire/support',
  mentorship:  '/hire/support',
}

type PointStatus = 'open' | 'in_review' | 'resolved'

const STATUS_CONFIG: Record<PointStatus, { label: string; color: string; bg: string; icon: string }> = {
  open:      { label: 'Open',      color: 'var(--amber)', bg: 'rgba(245,158,11,0.12)',   icon: 'fa-solid fa-circle-dot' },
  in_review: { label: 'In Review', color: 'var(--blue)',  bg: 'rgba(26,108,246,0.12)',   icon: 'fa-solid fa-hourglass-half' },
  resolved:  { label: 'Resolved',  color: 'var(--green)', bg: 'rgba(34,197,94,0.12)',    icon: 'fa-solid fa-circle-check' },
}

export default function FrictionMap({ points, startDate, journeyId, managerName }: FrictionMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [statusMap, setStatusMap] = useState<Record<string, PointStatus>>(() => {
    const fromData: Record<string, PointStatus> = {}
    for (const p of points) {
      if (p.status === 'resolved') fromData[p.id] = 'resolved'
    }
    try {
      const stored = JSON.parse(localStorage.getItem('friction_status') ?? '{}')
      return { ...stored, ...fromData }
    } catch {
      return fromData
    }
  })
  const [showResolved, setShowResolved] = useState(false)

  function setPointStatus(id: string, status: PointStatus) {
    setStatusMap(prev => {
      const next = { ...prev, [id]: status }
      try { localStorage.setItem('friction_status', JSON.stringify(next)) } catch {}
      return next
    })
    if (status === 'resolved') {
      setActiveId(null)
      if (journeyId && !managerName) startTransition(() => { resolveFrictionPoint(journeyId, id) })
      if (journeyId && managerName) startTransition(() => { resolveHireFrictionPoint(journeyId, id, managerName) })
    }
  }

  const getStatus = (id: string): PointStatus => statusMap[id] ?? 'open'

  const visiblePoints = points.filter(p => getStatus(p.id) !== 'resolved')
  const resolvedPoints = points.filter(p => getStatus(p.id) === 'resolved')

  const today = Date.now()
  const start = new Date(startDate).getTime()
  const elapsedDays = Math.min(JOURNEY_DAYS, Math.max(0, Math.round((today - start) / 86400000)))
  const progressPct = (elapsedDays / JOURNEY_DAYS) * 100

  const activePoint = activeId ? visiblePoints.find(p => p.id === activeId) ?? null : null

  return (
    <div className="db-card">
      {/* Header */}
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-route" style={{ color: 'var(--blue)' }} />
          Journey Timeline
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge-ai">AI Detected</span>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>
            Day {elapsedDays} of {JOURNEY_DAYS}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px 24px 24px' }}>

        {/* Phase labels */}
        <div style={{ display: 'flex', marginBottom: 6 }}>
          {PHASES.map(ph => (
            <div
              key={ph.label}
              style={{
                width: `${((ph.end - ph.start) / JOURNEY_DAYS) * 100}%`,
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {ph.label}
            </div>
          ))}
        </div>

        {/* Timeline track */}
        <div style={{ position: 'relative', height: 8, marginBottom: 32 }}>
          {/* Phase zone backgrounds */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', borderRadius: 100, overflow: 'hidden' }}>
            {PHASES.map((ph, i) => (
              <div
                key={ph.label}
                style={{
                  width: `${((ph.end - ph.start) / JOURNEY_DAYS) * 100}%`,
                  background: i % 2 === 0 ? 'var(--border)' : 'var(--surface2)',
                  borderRight: i < PHASES.length - 1 ? '1px solid var(--bg)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Progress fill */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: `${progressPct}%`,
            background: 'var(--grad)',
            borderRadius: 100,
            transition: 'width 0.6s var(--ease)',
          }} />

          {/* Today marker */}
          <div style={{
            position: 'absolute',
            left: `${progressPct}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 14, height: 14,
            background: 'var(--surface)',
            border: '3px solid var(--blue)',
            borderRadius: '50%',
            boxShadow: '0 0 0 3px rgba(26,108,246,0.15)',
            zIndex: 3,
          }} />

          {/* Friction event markers */}
          {visiblePoints.map(p => {
            const pct = (p.day / JOURNEY_DAYS) * 100
            const sc = SEV_CONFIG[p.severity]
            const isActive = activeId === p.id
            return (
              <button
                key={p.id}
                onClick={() => setActiveId(isActive ? null : p.id)}
                title={p.label}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isActive ? 18 : 14,
                  height: isActive ? 18 : 14,
                  borderRadius: '50%',
                  background: sc.color,
                  border: `2px solid var(--surface)`,
                  boxShadow: isActive ? `0 0 0 3px ${sc.border}` : 'none',
                  cursor: 'pointer',
                  zIndex: isActive ? 5 : 4,
                  transition: 'all 0.2s var(--ease)',
                  padding: 0,
                }}
              />
            )
          })}
        </div>

        {/* Day axis */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -20, marginBottom: 16 }}>
          {[0, 30, 60, 90].map(d => (
            <span key={d} style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>
              {d === 0 ? 'Start' : d === 90 ? 'Day 90' : `Day ${d}`}
            </span>
          ))}
        </div>

        {/* Inline event detail */}
        {activePoint && (() => {
          const sc = SEV_CONFIG[activePoint.severity]
          return (
            <div style={{
              background: sc.bg,
              border: `1px solid ${sc.border}`,
              borderLeft: `3px solid ${sc.color}`,
              borderRadius: 'var(--r)',
              padding: '14px 16px',
              marginBottom: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className={TYPE_ICON[activePoint.type]} style={{ fontSize: 13, color: sc.color }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{activePoint.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: sc.color,
                    background: 'var(--surface)', border: `1px solid ${sc.border}`,
                    padding: '1px 7px', borderRadius: 100,
                  }}>
                    {sc.label} · Day {activePoint.day}
                  </span>
                </div>
                <button
                  onClick={() => setActiveId(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}
                >
                  <i className="fa-solid fa-xmark" style={{ fontSize: 12 }} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, marginBottom: 10 }}>
                {activePoint.description}
              </p>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'var(--surface)', borderRadius: 'var(--r)', padding: '10px 12px',
                marginBottom: 10,
              }}>
                <i className="fa-solid fa-sparkles" style={{ fontSize: 11, marginTop: 2, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
                <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text)', fontWeight: 700 }}>AI Suggestion: </strong>
                  {activePoint.intervention}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {getStatus(activePoint.id) !== 'in_review' && (
                  <a
                    href={HELP_LINK[activePoint.type] ?? '/hire/support'}
                    onClick={() => setPointStatus(activePoint.id, 'in_review')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 12, fontWeight: 700,
                      padding: '7px 14px', borderRadius: 'var(--r)',
                      background: sc.color, color: '#fff', textDecoration: 'none',
                      boxShadow: `0 2px 8px ${sc.border}`,
                    }}
                  >
                    <i className="fa-solid fa-circle-question" style={{ fontSize: 11 }} />
                    Get Help
                  </a>
                )}
                {getStatus(activePoint.id) === 'in_review' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 'var(--r)', background: STATUS_CONFIG.in_review.bg, color: STATUS_CONFIG.in_review.color, border: `1px solid ${STATUS_CONFIG.in_review.color}30` }}>
                    <i className="fa-solid fa-hourglass-half" style={{ fontSize: 11 }} />
                    In Review
                  </span>
                )}
                <button
                  onClick={() => setPointStatus(activePoint.id, 'resolved')}
                  disabled={isPending}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 700,
                    padding: '7px 14px', borderRadius: 'var(--r)',
                    background: 'var(--surface)', color: 'var(--text2)',
                    border: '1px solid var(--border)', cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.6 : 1,
                  }}
                >
                  <i className={`fa-solid fa-${isPending ? 'spinner fa-spin' : 'circle-check'}`} style={{ fontSize: 11, color: 'var(--green)' }} />
                  {isPending ? 'Saving…' : 'Mark Resolved'}
                </button>
              </div>
            </div>
          )
        })()}

        {/* Event list */}
        {visiblePoints.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: activePoint ? 10 : 0 }}>
            {visiblePoints.map(p => {
              const sc = SEV_CONFIG[p.severity]
              const st = STATUS_CONFIG[getStatus(p.id)]
              const isActive = activeId === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveId(isActive ? null : p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: isActive ? sc.bg : 'transparent',
                    border: `1px solid ${isActive ? sc.border : 'transparent'}`,
                    borderRadius: 'var(--r)',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{p.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: st.bg, color: st.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className={st.icon} style={{ fontSize: 9 }} />
                    {st.label}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Day {p.day}</span>
                  <i
                    className={`fa-solid fa-chevron-${isActive ? 'up' : 'down'}`}
                    style={{ fontSize: 10, color: 'var(--text3)' }}
                  />
                </button>
              )
            })}
          </div>
        )}

        {visiblePoints.length === 0 && resolvedPoints.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 13 }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: 20, color: 'var(--green)', display: 'block', marginBottom: 8 }} />
            No friction events detected so far.
          </div>
        )}

        {/* Resolved section */}
        {resolvedPoints.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setShowResolved(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: 'var(--text3)', fontSize: 11, fontWeight: 700 }}
            >
              <i className={`fa-solid fa-chevron-${showResolved ? 'up' : 'down'}`} style={{ fontSize: 9 }} />
              {resolvedPoints.length} Resolved {resolvedPoints.length === 1 ? 'Issue' : 'Issues'}
            </button>
            {showResolved && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {resolvedPoints.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 'var(--r)', background: 'var(--surface2)', opacity: 0.7 }}>
                    <i className="fa-solid fa-circle-check" style={{ fontSize: 11, color: 'var(--green)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1, textDecoration: 'line-through' }}>{p.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: STATUS_CONFIG.resolved.bg, color: STATUS_CONFIG.resolved.color }}>
                      Resolved
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
