'use client'

import { useState, useEffect } from 'react'

interface RadarData {
  label: string
  value: number // 0-100
}

interface WeekSnapshot {
  week: number
  avg: number
}

interface IntegrationRadarProps {
  data?:           RadarData[]
  currentWeek?:    number
  journeyId?:      string
  initialHistory?: WeekSnapshot[]  // from Supabase, preferred over localStorage
}

const AXIS_META: Record<string, { desc: string; how: string }> = {
  Social:    { desc: 'Relationship depth with teammates', how: 'Check-ins completed + meeting attendance' },
  Technical: { desc: 'Task & process competency',        how: 'Week-1 task completion rate' },
  Culture:   { desc: 'Cultural alignment score',         how: 'Pulse check average (1-5 scale → 0-100)' },
  Process:   { desc: 'Overall task throughput',          how: 'Completed tasks / total tasks' },
  Feedback:  { desc: 'Two-way feedback loop health',     how: 'Check-in notes + feedback survey history' },
}

const AXIS_ACTIONS: Record<string, { icon: string; text: string; href?: string }[]> = {
  Social: [
    { icon: 'fa-solid fa-mug-hot',            text: 'Schedule a coffee chat with a teammate',   href: '/hire/resources/contacts' },
    { icon: 'fa-solid fa-users',              text: 'Attend the next team standup in person' },
    { icon: 'fa-solid fa-comment',            text: 'Send an intro message to your buddy' },
  ],
  Technical: [
    { icon: 'fa-solid fa-laptop-code',        text: 'Complete your IT setup task',              href: '/hire/tasks' },
    { icon: 'fa-solid fa-book-open',          text: 'Read the dev environment guide',           href: '/hire/resources/wiki' },
    { icon: 'fa-solid fa-user-check',         text: 'Ask a senior teammate to review your work' },
  ],
  Culture: [
    { icon: 'fa-solid fa-star',               text: 'Complete this week\'s pulse check survey' },
    { icon: 'fa-solid fa-book',               text: 'Read the company values handbook',         href: '/hire/resources/wiki' },
    { icon: 'fa-solid fa-calendar',           text: 'Join a team social or optional event' },
  ],
  Process: [
    { icon: 'fa-solid fa-list-check',         text: 'Clear your top pending task today',        href: '/hire/tasks' },
    { icon: 'fa-solid fa-clock',              text: 'Time-box one task and complete it fully' },
    { icon: 'fa-solid fa-circle-check',       text: 'Review last week\'s incomplete items' },
  ],
  Feedback: [
    { icon: 'fa-solid fa-comments',           text: 'Ask your manager for a quick feedback round' },
    { icon: 'fa-solid fa-calendar-check',     text: 'Confirm your next 1:1 is scheduled' },
    { icon: 'fa-solid fa-clipboard-question', text: 'Fill in the milestone feedback survey',    href: '/hire/dashboard' },
  ],
}

// Per-dimension benchmark targets at key weeks (linear interpolation used between them)
const BENCHMARKS: Record<string, [week: number, target: number][]> = {
  Social:    [[1, 20], [2, 40], [4, 65], [8, 85], [12, 95]],
  Technical: [[1, 30], [2, 55], [4, 75], [8, 90], [12, 95]],
  Culture:   [[1, 25], [2, 45], [4, 65], [8, 80], [12, 90]],
  Process:   [[1, 20], [2, 35], [4, 55], [8, 80], [12, 90]],
  Feedback:  [[1, 15], [2, 30], [4, 55], [8, 80], [12, 90]],
}

function getBenchmark(label: string, week: number): number {
  const pts = BENCHMARKS[label]
  if (!pts) return 70
  if (week <= pts[0][0]) return pts[0][1]
  if (week >= pts[pts.length - 1][0]) return pts[pts.length - 1][1]
  for (let i = 0; i < pts.length - 1; i++) {
    const [w0, t0] = pts[i]
    const [w1, t1] = pts[i + 1]
    if (week >= w0 && week <= w1) {
      return Math.round(t0 + ((week - w0) / (w1 - w0)) * (t1 - t0))
    }
  }
  return 70
}

export default function IntegrationRadar({ data, currentWeek = 1, journeyId, initialHistory }: IntegrationRadarProps) {
  const [hoveredAxis,   setHoveredAxis]   = useState<string | null>(null)
  const [clickedAxis,   setClickedAxis]   = useState<string | null>(null)
  const [weekHistory,   setWeekHistory]   = useState<WeekSnapshot[]>([])

  // Save snapshot to localStorage + Supabase (fire-and-forget); merge with initialHistory from DB
  useEffect(() => {
    if (!data?.length) return
    const key = `radar_history_${journeyId ?? 'default'}`
    const avg = Math.round(data.reduce((s, d) => s + d.value, 0) / data.length)

    // Start from Supabase history (most reliable) and merge local snapshot
    let base: WeekSnapshot[] = []
    if (initialHistory && initialHistory.length > 0) {
      base = initialHistory
    } else {
      try { base = JSON.parse(localStorage.getItem(key) ?? '[]') } catch { /* ignore */ }
    }

    const others  = base.filter(s => s.week !== currentWeek)
    const updated = [...others, { week: currentWeek, avg }]
      .sort((a, b) => a.week - b.week)
      .slice(-6)

    // Persist locally
    try { localStorage.setItem(key, JSON.stringify(updated)) } catch { /* ignore */ }
    setWeekHistory(updated.slice(-4))

    // Persist to Supabase (non-blocking) — save full radar snapshot for this week
    if (journeyId) {
      fetch('/api/pulse/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journeyId, week: currentWeek, radarSnapshot: data }),
      }).catch(() => { /* non-critical, ignore */ })
    }
  }, [data, currentWeek, journeyId, initialHistory])

  if (!data || data.length === 0) {
    return (
      <div className="db-card">
        <div className="db-card-hd">
          <h3>
            <i className="fa-solid fa-compass-drafting" style={{ color: 'var(--blue)' }} />
            Integration Velocity
          </h3>
        </div>
        <div className="db-card-bd" style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text3)' }}>
          <i className="fa-solid fa-radar" style={{ fontSize: 28, opacity: 0.3, display: 'block', marginBottom: 10 }} />
          <p style={{ fontSize: 12, fontWeight: 500 }}>No integration data yet.</p>
          <p style={{ fontSize: 11, marginTop: 4 }}>Data will appear after your first week.</p>
        </div>
      </div>
    )
  }

  const size      = 260
  const center    = size / 2
  const radius    = size * 0.35
  const angleStep = (Math.PI * 2) / data.length

  const getPoints = (values: number[]) =>
    values.map((v, i) => {
      const angle = i * angleStep - Math.PI / 2
      const r     = (v / 100) * radius
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
    }).join(' ')

  const dataPoints      = data.map(d => d.value)
  const benchmarkPoints = data.map(d => getBenchmark(d.label, currentWeek))

  const axes = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2
    const bmark = getBenchmark(d.label, currentWeek)
    const gap   = d.value - bmark
    return {
      x:      center + radius * Math.cos(angle),
      y:      center + radius * Math.sin(angle),
      lx:     center + (radius + 26) * Math.cos(angle),
      ly:     center + (radius + 26) * Math.sin(angle),
      label:  d.label,
      value:  d.value,
      benchmark: bmark,
      gap,
    }
  })

  const topDimension  = [...data].sort((a, b) => b.value - a.value)[0]
  const worstAxis     = axes.reduce((w, a) => a.gap < w.gap ? a : w, axes[0])
  const hovered       = hoveredAxis ? axes.find(a => a.label === hoveredAxis) ?? null : null

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-compass-drafting" style={{ color: 'var(--blue)' }} />
          Integration Velocity
        </h3>
        <span className="badge-ai">
          <i className="fa-solid fa-signal" style={{ marginRight: 3 }} />
          Live Sensors
        </span>
      </div>

      <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Radar chart */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div className="radar-scanline-pro" />
          <svg width={size} height={size} style={{ overflow: 'visible' }} aria-label="Integration velocity radar chart">
            <defs>
              <filter id="radar-glow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Rings */}
            {[0.2, 0.4, 0.6, 0.8, 1].map((f, i) => (
              <circle key={i} cx={center} cy={center} r={radius * f}
                fill="none" stroke="var(--border)" strokeWidth="1" />
            ))}

            {/* Axes */}
            {axes.map((axis, i) => (
              <line key={i} x1={center} y1={center} x2={axis.x} y2={axis.y}
                stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
            ))}

            {/* Benchmark target polygon */}
            <polygon
              points={getPoints(benchmarkPoints)}
              fill="none"
              stroke="rgba(245,158,11,0.55)"
              strokeWidth="1.5"
              strokeDasharray="5 3"
              strokeLinejoin="round"
            />

            {/* Data polygon */}
            <polygon points={getPoints(dataPoints)}
              fill="rgba(0,200,224,0.1)" stroke="var(--cyan)" strokeWidth="2" strokeLinejoin="round" />
            <polygon points={getPoints(dataPoints.map(v => v * 0.95))}
              fill="none" stroke="var(--cyan)" strokeWidth="1" opacity={0.5} filter="url(#radar-glow)" />

            {/* Axis labels — hover for tooltip, click for actions */}
            {axes.map((axis) => {
              const meta     = AXIS_META[axis.label]
              const isHover  = hoveredAxis === axis.label
              const isActive = clickedAxis === axis.label
              return (
                <text
                  key={axis.label}
                  x={axis.lx} y={axis.ly}
                  fill={isActive ? 'var(--blue)' : isHover ? 'var(--cyan)' : 'var(--text2)'}
                  fontSize="10" fontWeight="800"
                  textAnchor="middle" dominantBaseline="middle"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer' }}
                  onMouseEnter={() => meta && setHoveredAxis(axis.label)}
                  onMouseLeave={() => setHoveredAxis(null)}
                  onClick={() => setClickedAxis(prev => prev === axis.label ? null : axis.label)}
                >
                  {axis.label}
                </text>
              )
            })}
          </svg>

          {/* Tooltip */}
          {hovered && AXIS_META[hovered.label] && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: '10px 12px',
              boxShadow: 'var(--card-shadow)',
              width: 180, zIndex: 10, pointerEvents: 'none',
            }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--cyan)', marginBottom: 4 }}>{hovered.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>{AXIS_META[hovered.label].desc}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 8 }}>
                <i className="fa-solid fa-calculator" style={{ marginRight: 4 }} />
                {AXIS_META[hovered.label].how}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
                <span style={{ color: hovered.gap >= 0 ? 'var(--green)' : 'var(--amber)' }}>
                  You: {hovered.value}%
                </span>
                <span style={{ color: 'rgba(245,158,11,0.8)' }}>
                  Target W{currentWeek}: {hovered.benchmark}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--cyan)' }}>
            <span style={{ width: 16, height: 2, background: 'var(--cyan)', borderRadius: 1, display: 'inline-block' }} />
            Your score
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(245,158,11,0.8)' }}>
            <span style={{ width: 16, height: 0, border: '1px dashed rgba(245,158,11,0.8)', display: 'inline-block' }} />
            Week {currentWeek} target
          </span>
        </div>

        {/* Mini score bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map((d) => {
            const bmark = getBenchmark(d.label, currentWeek)
            const gap   = d.value - bmark
            return (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', width: 62, flexShrink: 0 }}>
                  {d.label}
                </span>
                <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'visible', position: 'relative' }}>
                  <div style={{
                    height: '100%', width: `${d.value}%`,
                    background: d.value >= 80 ? 'var(--grad)' : d.value >= 60 ? 'var(--blue)' : 'var(--amber)',
                    borderRadius: 100, transition: 'width 0.6s var(--ease)',
                  }} />
                  {/* Benchmark tick */}
                  <div style={{
                    position: 'absolute', top: -2, left: `${bmark}%`,
                    width: 2, height: 9,
                    background: 'rgba(245,158,11,0.8)', borderRadius: 1,
                    transform: 'translateX(-50%)',
                  }} title={`Week ${currentWeek} target: ${bmark}%`} />
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: d.value >= 80 ? 'var(--cyan)' : d.value >= 60 ? 'var(--blue)' : 'var(--amber)',
                  width: 28, textAlign: 'right', flexShrink: 0,
                  fontFamily: 'var(--font-display)',
                }}>
                  {d.value}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, flexShrink: 0, width: 26,
                  color: gap >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {gap >= 0 ? `+${gap}` : gap}
                </span>
              </div>
            )
          })}
        </div>

        {/* Insight */}
        <div style={{ background: 'var(--bg)', borderRadius: 'var(--r)', border: '1px solid var(--border)', padding: '12px 14px' }}>
          <p style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, fontWeight: 600, margin: 0 }}>
            <i className="fa-solid fa-sparkles" style={{
              marginRight: 6, fontSize: 10,
              background: 'var(--grad)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }} />
            <strong style={{ color: 'var(--blue)' }}>Top: </strong>
            {topDimension.label} at {topDimension.value}%.
            {worstAxis.gap < -10 && (
              <> Focus on <strong style={{ color: 'var(--amber)' }}>{worstAxis.label}</strong> — {Math.abs(worstAxis.gap)}pts below your week {currentWeek} target.</>
            )}
          </p>
          {!clickedAxis && (
            <p style={{ fontSize: 10, color: 'var(--text3)', margin: '6px 0 0', fontWeight: 500 }}>
              <i className="fa-solid fa-hand-pointer" style={{ marginRight: 4 }} />
              Tap any axis label to see how to improve it
            </p>
          )}
        </div>

        {/* 4-week avg trend */}
        {weekHistory.length >= 2 && (
          <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Integration trend
              </span>
              {(() => {
                const last = weekHistory[weekHistory.length - 1]
                const prev = weekHistory[weekHistory.length - 2]
                const delta = last.avg - prev.avg
                return delta !== 0 ? (
                  <span style={{ fontSize: 10, fontWeight: 700, color: delta > 0 ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <i className={delta > 0 ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'} style={{ fontSize: 9 }} />
                    {delta > 0 ? '+' : ''}{delta}% vs last week
                  </span>
                ) : null
              })()}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              {weekHistory.map((s, i) => {
                const barH  = Math.max(6, Math.round((s.avg / 100) * 36))
                const color = s.avg >= 70 ? 'var(--green)' : s.avg >= 45 ? 'var(--blue)' : 'var(--amber)'
                const isLast = i === weekHistory.length - 1
                return (
                  <div key={s.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>{s.avg}%</span>
                    <div style={{ width: '100%', height: barH, background: color, borderRadius: 3, opacity: isLast ? 1 : 0.5, outline: isLast ? `2px solid ${color}` : 'none', outlineOffset: 1 }} />
                    <span style={{ fontSize: 9, fontWeight: isLast ? 700 : 500, color: isLast ? 'var(--cyan)' : 'var(--text3)' }}>W{s.week}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions panel — shown when an axis is clicked */}
        {clickedAxis && AXIS_ACTIONS[clickedAxis] && (
          <div style={{ background: 'rgba(26,108,246,0.06)', border: '1px solid rgba(26,108,246,0.2)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(26,108,246,0.15)' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <i className="fa-solid fa-lightbulb" style={{ marginRight: 6 }} />
                How to improve {clickedAxis}
              </span>
              <button onClick={() => setClickedAxis(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 12, padding: 2 }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {AXIS_ACTIONS[clickedAxis].map((action, i) => (
                action.href ? (
                  <a
                    key={i}
                    href={action.href}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < AXIS_ACTIONS[clickedAxis].length - 1 ? '1px solid rgba(26,108,246,0.1)' : 'none', textDecoration: 'none', color: 'var(--text)', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(26,108,246,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <i className={action.icon} style={{ fontSize: 12, color: 'var(--blue)', width: 14, textAlign: 'center', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{action.text}</span>
                    <i className="fa-solid fa-arrow-right" style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 'auto' }} />
                  </a>
                ) : (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < AXIS_ACTIONS[clickedAxis].length - 1 ? '1px solid rgba(26,108,246,0.1)' : 'none' }}
                  >
                    <i className={action.icon} style={{ fontSize: 12, color: 'var(--blue)', width: 14, textAlign: 'center', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{action.text}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
