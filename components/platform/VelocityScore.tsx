'use client'

import { useRouter } from 'next/navigation'

interface Task {
  id: string
  week: number
  status: string
  completed_at?: string | null
}

interface Journey {
  id: string
  current_week: number
  employee?: { full_name?: string } | null
}

interface VelocityScoreProps {
  journeys: Journey[]
  tasksByJourney?: Record<string, Task[]>
}

function computeVelocity(tasks: Task[], week: number): number {
  if (!tasks.length || week < 1) return 0
  const weekTasks = tasks.filter(t => t.week === week)
  if (!weekTasks.length) return 0
  const done = weekTasks.filter(t => t.status === 'completed').length
  return Math.round((done / weekTasks.length) * 100)
}

const PACE_CONFIG = [
  { min: 80, label: 'On Fire',     color: '#22C55E', icon: 'fa-solid fa-rocket', bg: 'rgba(34,197,94,0.12)' },
  { min: 55, label: 'On Track',    color: '#00C8E0', icon: 'fa-solid fa-check',  bg: 'rgba(0,200,224,0.12)' },
  { min: 30, label: 'Slowing',     color: '#F59E0B', icon: 'fa-solid fa-gauge',  bg: 'rgba(245,158,11,0.12)' },
  { min: 0,  label: 'At Risk',     color: '#EF4444', icon: 'fa-solid fa-triangle-exclamation', bg: 'rgba(239,68,68,0.12)' },
]

function getPace(pct: number) {
  return PACE_CONFIG.find(c => pct >= c.min) ?? PACE_CONFIG[PACE_CONFIG.length - 1]
}

export default function VelocityScore({ journeys, tasksByJourney = {} }: VelocityScoreProps) {
  const router = useRouter()
  // Day of business week (1 = Mon, 5 = Fri). Weekend days collapse to 5.
  const jsDay = new Date().getDay() // 0 Sun … 6 Sat
  const dayOfWeek = jsDay === 0 ? 5 : jsDay === 6 ? 5 : jsDay
  const hireJourneys = journeys.filter(j => j.employee?.full_name)
  if (hireJourneys.length === 0) return null

  const scores = hireJourneys.map(j => ({
    name:         j.employee?.full_name ?? 'Unknown',
    week:         j.current_week,
    velocity:     computeVelocity(tasksByJourney[j.id] ?? [], j.current_week),
    prevVelocity: computeVelocity(tasksByJourney[j.id] ?? [], j.current_week - 1),
  }))

  const avgVelocity = scores.length
    ? Math.round(scores.reduce((s, x) => s + x.velocity, 0) / scores.length)
    : 0

  const avgPrevVelocity = scores.filter(s => s.prevVelocity > 0).length
    ? Math.round(scores.filter(s => s.prevVelocity > 0).reduce((s, x) => s + x.prevVelocity, 0) / scores.filter(s => s.prevVelocity > 0).length)
    : null

  const weekDelta = avgPrevVelocity !== null ? avgVelocity - avgPrevVelocity : null

  const overallPace = getPace(avgVelocity)

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-gauge-high" style={{ color: 'var(--cyan)' }} aria-hidden="true" />
          {' '}Onboarding Velocity
        </h3>
        <span className="badge-ai">Day {dayOfWeek} of 5</span>
      </div>

      <div className="db-card-bd">
        {/* Overall score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '14px 16px', background: overallPace.bg, border: `1px solid ${overallPace.color}30`, borderRadius: 'var(--r-lg)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${overallPace.color}20`, border: `2px solid ${overallPace.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={overallPace.icon} style={{ fontSize: 18, color: overallPace.color }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: overallPace.color, marginBottom: 2 }}>
              Team Pace — {overallPace.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-display)', color: overallPace.color, lineHeight: 1 }}>
                {avgVelocity}%
              </span>
              {weekDelta !== null && (
                <span style={{ fontSize: 11, fontWeight: 700, color: weekDelta >= 0 ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <i className={weekDelta >= 0 ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'} style={{ fontSize: 10 }} />
                  {weekDelta >= 0 ? '+' : ''}{weekDelta}% vs last week
                </span>
              )}
              <span style={{ fontSize: 12, color: 'var(--text3)', width: '100%' }}>
                avg completion · {dayOfWeek <= 2 ? 'early in the week' : dayOfWeek === 3 ? 'mid-week' : 'end of week'}
              </span>
            </div>
          </div>
        </div>

        {/* Per-hire breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scores.map((s, i) => {
            const pace = getPace(s.velocity)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${pace.color}18`, border: `1.5px solid ${pace.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={pace.icon} style={{ fontSize: 11, color: pace.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pace.color, flexShrink: 0, marginLeft: 8 }}>{s.velocity}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.velocity}%`, background: pace.color, borderRadius: 99, transition: 'width 0.6s var(--ease)' }} />
                  </div>
                </div>
                <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>Wk {s.week}</span>
              </div>
            )
          })}
        </div>

        {/* Contextual CTA for Slowing / At Risk */}
        {(overallPace.label === 'Slowing' || overallPace.label === 'At Risk') && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: `${overallPace.color}10`, border: `1px solid ${overallPace.color}30`, borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 14, color: overallPace.color, flexShrink: 0 }} aria-hidden="true" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, margin: '0 0 2px' }}>
                {overallPace.label === 'At Risk' ? 'Immediate attention needed' : 'Team is losing momentum'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>
                {overallPace.label === 'At Risk'
                  ? 'Review your hires\' blocked tasks and schedule a 1:1.'
                  : 'Check for blockers and consider adjusting task scope this week.'}
              </p>
            </div>
            <button
              onClick={() => router.push('/manager/hires')}
              style={{ flexShrink: 0, background: overallPace.color, color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Review hires
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
