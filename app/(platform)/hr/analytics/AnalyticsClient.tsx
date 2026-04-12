'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import RiskScoreCard from '@/components/ai/RiskScoreCard'
import RunRiskScanButton from '@/components/ai/RunRiskScanButton'

// ── Types ──────────────────────────────────────────────────────────────────

interface Employee {
  id: string
  full_name: string
  department: string
  avatar_url?: string
}

interface Journey {
  id: string
  status: 'active' | 'at_risk' | 'completed' | 'paused'
  current_week: number
  risk_score: number
  risk_reasons: string[]
  start_date: string
  employee: Employee
  manager: { id: string; full_name: string }
}

interface Task {
  journey_id: string
  status: string
  week: number
}

interface CheckIn {
  id: string
  milestone: string
  scheduled_date: string
  completed_date: string | null
  journey: { employee: { full_name: string; department: string } }
  manager: { full_name: string }
}

interface Feedback {
  id: string
  milestone: string
  rating: number
  comments: string | null
  created_at: string
  employee: { full_name: string }
}

interface Props {
  journeys: Journey[]
  tasks: Task[]
  checkIns: CheckIn[]
  feedback: Feedback[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MILESTONE_LABELS: Record<string, string> = {
  day_7:  'Day 7',
  day_30: 'Day 30',
  day_60: 'Day 60',
  day_90: 'Day 90',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <i
          key={s}
          className="fa-solid fa-star"
          style={{ fontSize: size, color: s <= rating ? 'var(--amber)' : 'var(--border2)' }}
        />
      ))}
    </div>
  )
}

function exportCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main Component ─────────────────────────────────────────────────────────

type Tab = 'overview' | 'risk' | 'checkins' | 'feedback'

export default function AnalyticsClient({ journeys, tasks, checkIns, feedback }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // ── KPIs ────────────────────────────────────────────────────────────────
  const activeJourneys   = useMemo(() => journeys.filter(j => j.status !== 'completed'), [journeys])
  const completedJourneys = useMemo(() => journeys.filter(j => j.status === 'completed'), [journeys])
  const atRisk           = useMemo(() => activeJourneys.filter(j => j.risk_score > 60).length, [activeJourneys])
  const onTrackPct       = activeJourneys.length > 0
    ? Math.round((activeJourneys.filter(j => j.risk_score <= 30).length / activeJourneys.length) * 100)
    : 100
  const completedTasks   = useMemo(() => tasks.filter(t => t.status === 'completed').length, [tasks])
  const avgRating        = useMemo(() => {
    if (!feedback.length) return 0
    return +(feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
  }, [feedback])

  // ── Weekly completion data ───────────────────────────────────────────────
  const weekData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const week = i + 1
      const wt   = tasks.filter(t => t.week === week)
      const done = wt.filter(t => t.status === 'completed').length
      const rate = wt.length > 0 ? Math.round((done / wt.length) * 100) : 0
      return { week, total: wt.length, done, rate }
    })
  }, [tasks])

  // ── Check-ins data ───────────────────────────────────────────────────────
  const now           = new Date()
  const overdueCI     = checkIns.filter(ci => !ci.completed_date && new Date(ci.scheduled_date) < now)
  const upcomingCI    = checkIns.filter(ci => !ci.completed_date && new Date(ci.scheduled_date) >= now)
  const completedCI   = checkIns.filter(ci => !!ci.completed_date)

  // ── AI insight text ──────────────────────────────────────────────────────
  const insightText = atRisk > 0
    ? `${atRisk} employee${atRisk > 1 ? 's are' : ' is'} currently at risk. ${onTrackPct}% of active journeys are on track. ${overdueCI.length > 0 ? `${overdueCI.length} check-in${overdueCI.length > 1 ? 's are' : ' is'} overdue.` : 'All check-ins are up to date.'}`
    : `All ${activeJourneys.length} active journeys are on track. ${completedJourneys.length} journeys completed so far.${avgRating > 0 ? ` Average feedback rating: ${avgRating}/5.` : ''}`

  // ── Export handlers ───────────────────────────────────────────────────────
  function handleExport() {
    if (activeTab === 'overview' || activeTab === 'risk') {
      exportCSV(`risk-report-${new Date().toISOString().split('T')[0]}.csv`, [
        ['Employee', 'Department', 'Week', 'Risk Score', 'Status', 'Risk Factors'],
        ...activeJourneys.map(j => [
          j.employee?.full_name || '',
          j.employee?.department || '',
          String(j.current_week),
          String(j.risk_score),
          j.status,
          (j.risk_reasons || []).join('; '),
        ]),
      ])
    } else if (activeTab === 'checkins') {
      exportCSV(`checkins-report-${new Date().toISOString().split('T')[0]}.csv`, [
        ['Employee', 'Department', 'Milestone', 'Manager', 'Scheduled', 'Completed', 'Status'],
        ...checkIns.map(ci => [
          ci.journey?.employee?.full_name || '',
          ci.journey?.employee?.department || '',
          MILESTONE_LABELS[ci.milestone] || ci.milestone,
          ci.manager?.full_name || '',
          fmtDate(ci.scheduled_date),
          ci.completed_date ? fmtDate(ci.completed_date) : '',
          ci.completed_date ? 'Completed' : new Date(ci.scheduled_date) < now ? 'Overdue' : 'Upcoming',
        ]),
      ])
    } else if (activeTab === 'feedback') {
      exportCSV(`feedback-report-${new Date().toISOString().split('T')[0]}.csv`, [
        ['Employee', 'Milestone', 'Rating', 'Comments', 'Date'],
        ...feedback.map(f => [
          f.employee?.full_name || '',
          MILESTONE_LABELS[f.milestone] || f.milestone,
          String(f.rating),
          f.comments || '',
          fmtDate(f.created_at),
        ]),
      ])
    }
  }

  const TABS: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview',  label: 'Overview',    icon: 'fa-solid fa-chart-pie' },
    { id: 'risk',      label: 'Risk',        icon: 'fa-solid fa-triangle-exclamation', badge: atRisk > 0 ? atRisk : undefined },
    { id: 'checkins',  label: 'Check-ins',   icon: 'fa-solid fa-calendar-check',       badge: overdueCI.length > 0 ? overdueCI.length : undefined },
    { id: 'feedback',  label: 'Feedback',    icon: 'fa-solid fa-star' },
  ]

  return (
    <>
      {/* Header */}
      <header className="db-header">
        <div className="db-header-left">
          <h1>Analytics &amp; Reports</h1>
          <p>Organization-wide onboarding health, risk signals, and feedback.</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm" onClick={handleExport}>
            <i className="fa-solid fa-download" /> Export
          </button>
          <RunRiskScanButton />
        </div>
      </header>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* AI Insight Banner */}
        <div style={{
          background: 'var(--grad-soft)',
          border: '1px solid var(--blue-light)',
          borderRadius: 'var(--r-xl)',
          padding: '14px 18px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--r)',
            background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="fa-solid fa-sparkles" style={{ fontSize: 13, color: '#fff' }} />
          </div>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
              background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              AI Insight
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{insightText}</p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="kpi-row">
          {[
            { label: 'Active Journeys', value: activeJourneys.length,  icon: 'fa-solid fa-route',                    colorClass: 'blue'  },
            { label: 'On Track',        value: `${onTrackPct}%`,        icon: 'fa-solid fa-circle-check',             colorClass: 'green' },
            { label: 'Tasks Completed', value: completedTasks,          icon: 'fa-solid fa-list-check',               colorClass: 'cyan'  },
            { label: 'At Risk',         value: atRisk,                  icon: 'fa-solid fa-triangle-exclamation',     colorClass: atRisk > 0 ? 'red' : 'green' },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className={`kpi-icon ${k.colorClass}`}>
                <i className={k.icon} />
              </div>
              <div className="kpi-body">
                <div className="kpi-value">{k.value}</div>
                <div className="kpi-label">{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="db-card" style={{ padding: '4px 8px', display: 'flex', gap: 2 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 'var(--r)',
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: activeTab === tab.id ? 'var(--grad-soft)' : 'transparent',
                color: activeTab === tab.id ? 'var(--blue)' : 'var(--text3)',
                transition: 'all 0.15s', position: 'relative',
              }}
            >
              <i className={tab.icon} style={{ fontSize: 11 }} />
              {tab.label}
              {tab.badge !== undefined && (
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '1px 5px',
                  borderRadius: 100, background: 'var(--red)', color: '#fff',
                  lineHeight: 1.4,
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {/* ── OVERVIEW TAB ──────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Journey health breakdown */}
                <div className="db-card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fa-solid fa-heart-pulse" style={{ color: 'var(--blue)', fontSize: 13 }} />
                    Journey Health
                  </div>
                  {[
                    { label: 'On Track',   count: activeJourneys.filter(j => j.risk_score <= 30).length,           color: 'var(--green)',  bg: 'var(--green-bg)' },
                    { label: 'Needs Attention', count: activeJourneys.filter(j => j.risk_score > 30 && j.risk_score <= 60).length, color: 'var(--amber)',  bg: 'var(--amber-bg)' },
                    { label: 'At Risk',    count: activeJourneys.filter(j => j.risk_score > 60).length,            color: 'var(--red)',    bg: 'var(--red-bg)'   },
                    { label: 'Completed',  count: completedJourneys.length,                                         color: 'var(--blue)',   bg: 'var(--blue-light)' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: row.color, flexShrink: 0,
                      }} />
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text2)' }}>{row.label}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 800, padding: '2px 10px',
                        borderRadius: 100, color: row.color, background: row.bg,
                      }}>
                        {row.count}
                      </span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
                  <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{journeys.length} total employees</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, color: 'var(--blue)', padding: '2px 6px' }}
                      onClick={() => setActiveTab('risk')}
                    >
                      View Risk Details <i className="fa-solid fa-arrow-right" />
                    </button>
                  </div>
                </div>

                {/* Weekly completion chart */}
                <div className="db-card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fa-solid fa-chart-bar" style={{ color: 'var(--cyan)', fontSize: 13 }} />
                    Task Completion by Week
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {weekData.map(w => (
                      <div key={w.week} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', minWidth: 48, flexShrink: 0 }}>
                          Week {w.week}
                        </span>
                        <div style={{ flex: 1, height: 7, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 100,
                            width: `${w.rate}%`,
                            background: w.rate < 50 ? 'var(--amber)' : w.rate === 100 ? 'var(--green)' : 'var(--grad)',
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, minWidth: 32, textAlign: 'right',
                          color: w.rate < 50 ? 'var(--amber)' : 'var(--text2)',
                        }}>
                          {w.total > 0 ? `${w.rate}%` : '—'}
                        </span>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
                        No task data yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Check-in snapshot */}
                <div className="db-card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <span><i className="fa-solid fa-calendar-check" style={{ color: 'var(--aqua)', fontSize: 13, marginRight: 8 }} />Check-ins</span>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--blue)', padding: '2px 6px' }} onClick={() => setActiveTab('checkins')}>
                      View All <i className="fa-solid fa-arrow-right" />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Total',     value: checkIns.length,    color: 'var(--text2)' },
                      { label: 'Done',      value: completedCI.length, color: 'var(--green)' },
                      { label: 'Overdue',   value: overdueCI.length,   color: overdueCI.length > 0 ? 'var(--red)' : 'var(--text3)' },
                    ].map(s => (
                      <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', background: 'var(--bg)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {overdueCI.length > 0 && (
                    <div style={{ background: 'var(--red-bg)', borderRadius: 'var(--r)', padding: '10px 12px', fontSize: 12, color: 'var(--red)' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
                      {overdueCI.length} overdue check-in{overdueCI.length > 1 ? 's need' : ' needs'} immediate attention.
                    </div>
                  )}
                </div>

                {/* Feedback snapshot */}
                <div className="db-card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <span><i className="fa-solid fa-star" style={{ color: 'var(--amber)', fontSize: 13, marginRight: 8 }} />Feedback</span>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--blue)', padding: '2px 6px' }} onClick={() => setActiveTab('feedback')}>
                      View All <i className="fa-solid fa-arrow-right" />
                    </button>
                  </div>
                  {feedback.length > 0 ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: 36, fontWeight: 800, lineHeight: 1,
                            fontFamily: 'var(--font-display)', color: 'var(--amber)',
                          }}>
                            {avgRating}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 4 }}>out of 5</div>
                        </div>
                        <div>
                          <StarRow rating={Math.round(avgRating)} size={14} />
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
                            Based on {feedback.length} response{feedback.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      {/* Distribution */}
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = feedback.filter(f => f.rating === star).length
                        const pct   = feedback.length > 0 ? Math.round((count / feedback.length) * 100) : 0
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <span style={{ fontSize: 10, color: 'var(--text3)', minWidth: 10 }}>{star}</span>
                            <i className="fa-solid fa-star" style={{ fontSize: 9, color: 'var(--amber)', flexShrink: 0 }} />
                            <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--amber)', borderRadius: 100 }} />
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--text3)', minWidth: 24, textAlign: 'right' }}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <i className="fa-solid fa-comment-slash" style={{ fontSize: 24, color: 'var(--text3)', display: 'block', marginBottom: 8 }} />
                      <p style={{ fontSize: 13, color: 'var(--text3)' }}>No feedback yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── RISK TAB ──────────────────────────────────────────── */}
            {activeTab === 'risk' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeJourneys.length === 0 ? (
                  <div className="db-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <i className="fa-solid fa-circle-check" style={{ fontSize: 32, color: 'var(--green)', display: 'block', marginBottom: 12 }} />
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>All Clear</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>No active journeys to display.</div>
                  </div>
                ) : (
                  [...activeJourneys]
                    .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
                    .map(j => (
                      <RiskScoreCard
                        key={j.id}
                        employeeName={j.employee?.full_name || 'Unknown'}
                        department={j.employee?.department || ''}
                        score={j.risk_score ?? 0}
                        currentWeek={j.current_week ?? 1}
                        reasons={j.risk_reasons || []}
                        avatarUrl={j.employee?.avatar_url}
                        employeeId={j.employee?.id}
                        onViewJourney={() => router.push(`/hr/employees/${j.employee?.id}`)}
                      />
                    ))
                )}
              </div>
            )}

            {/* ── CHECK-INS TAB ─────────────────────────────────────── */}
            {activeTab === 'checkins' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Sub-summary */}
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { label: 'Total',     value: checkIns.length,    icon: 'fa-solid fa-calendar',         color: 'var(--text2)',  bg: 'var(--surface)' },
                    { label: 'Completed', value: completedCI.length, icon: 'fa-solid fa-circle-check',     color: 'var(--green)', bg: 'var(--green-bg)' },
                    { label: 'Upcoming',  value: upcomingCI.length,  icon: 'fa-solid fa-calendar-clock',   color: 'var(--blue)',  bg: 'var(--blue-light)' },
                    { label: 'Overdue',   value: overdueCI.length,   icon: 'fa-solid fa-triangle-exclamation', color: 'var(--red)',   bg: 'var(--red-bg)' },
                  ].map(s => (
                    <div key={s.label} style={{
                      flex: 1, padding: '14px 16px', borderRadius: 'var(--r-xl)',
                      background: s.bg, border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <i className={s.icon} style={{ fontSize: 14, color: s.color }} />
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overdue section */}
                {overdueCI.length > 0 && (
                  <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-bg)' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--red)', fontSize: 12 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>Overdue ({overdueCI.length})</span>
                    </div>
                    {overdueCI.map((ci, i) => (
                      <CheckInRow key={ci.id} ci={ci} isLast={i === overdueCI.length - 1} isOverdue />
                    ))}
                  </div>
                )}

                {/* Upcoming section */}
                {upcomingCI.length > 0 && (
                  <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-calendar-clock" style={{ color: 'var(--blue)', fontSize: 12 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>Upcoming ({upcomingCI.length})</span>
                    </div>
                    {upcomingCI.map((ci, i) => (
                      <CheckInRow key={ci.id} ci={ci} isLast={i === upcomingCI.length - 1} />
                    ))}
                  </div>
                )}

                {/* Completed section */}
                {completedCI.length > 0 && (
                  <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)', fontSize: 12 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>Completed ({completedCI.length})</span>
                    </div>
                    {completedCI.map((ci, i) => (
                      <CheckInRow key={ci.id} ci={ci} isLast={i === completedCI.length - 1} isDone />
                    ))}
                  </div>
                )}

                {checkIns.length === 0 && (
                  <div className="db-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <i className="fa-solid fa-calendar-check" style={{ fontSize: 32, color: 'var(--text3)', display: 'block', marginBottom: 12 }} />
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No check-ins yet</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>Check-ins will appear here once journeys are active.</div>
                  </div>
                )}
              </div>
            )}

            {/* ── FEEDBACK TAB ──────────────────────────────────────── */}
            {activeTab === 'feedback' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {feedback.length > 0 ? (
                  <>
                    {/* Score summary card */}
                    <div className="db-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 24 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: 48, fontWeight: 800, lineHeight: 1,
                          fontFamily: 'var(--font-display)', color: 'var(--amber)',
                        }}>
                          {avgRating}
                        </div>
                        <StarRow rating={Math.round(avgRating)} size={16} />
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                          {feedback.length} response{feedback.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>Rating Distribution</div>
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = feedback.filter(f => f.rating === star).length
                          const pct   = Math.round((count / feedback.length) * 100)
                          return (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 8 }}>{star}</span>
                              <i className="fa-solid fa-star" style={{ fontSize: 9, color: 'var(--amber)', flexShrink: 0 }} />
                              <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--amber)', borderRadius: 100, transition: 'width 0.5s ease' }} />
                              </div>
                              <span style={{ fontSize: 10, color: 'var(--text3)', minWidth: 40, textAlign: 'right' }}>{count} ({pct}%)</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Individual responses */}
                    <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
                      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>All Responses</span>
                      </div>
                      {feedback.map((f, i) => (
                        <div
                          key={f.id}
                          style={{
                            padding: '16px 20px',
                            borderBottom: i < feedback.length - 1 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'var(--grad-soft)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                <i className="fa-solid fa-user" style={{ fontSize: 12, color: 'var(--blue)' }} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                  {f.employee?.full_name || 'Anonymous'}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                                  {MILESTONE_LABELS[f.milestone] || f.milestone} · {fmtDate(f.created_at)}
                                </div>
                              </div>
                            </div>
                            <StarRow rating={f.rating} size={12} />
                          </div>
                          {f.comments && (
                            <div style={{
                              fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
                              padding: '10px 14px', background: 'var(--bg)',
                              borderRadius: 'var(--r)', borderLeft: '3px solid var(--blue-light)',
                              fontStyle: 'italic',
                            }}>
                              &ldquo;{f.comments}&rdquo;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="db-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <i className="fa-solid fa-comment-slash" style={{ fontSize: 32, color: 'var(--text3)', display: 'block', marginBottom: 12 }} />
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No feedback yet</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>Feedback will appear here once employees complete surveys.</div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}

// ── CheckInRow sub-component ───────────────────────────────────────────────

function CheckInRow({ ci, isLast, isOverdue, isDone }: { ci: CheckIn; isLast: boolean; isOverdue?: boolean; isDone?: boolean }) {
  const color = isOverdue ? 'var(--red)' : isDone ? 'var(--green)' : 'var(--blue)'
  const icon  = isOverdue ? 'fa-solid fa-triangle-exclamation' : isDone ? 'fa-solid fa-circle-check' : 'fa-solid fa-calendar-clock'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 20px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <i className={icon} style={{ color, fontSize: 13, flexShrink: 0, width: 16, textAlign: 'center' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {MILESTONE_LABELS[ci.milestone] || ci.milestone} Check-in
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
          {ci.journey?.employee?.full_name || 'Unknown'} · {ci.journey?.employee?.department || ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: isOverdue ? 'var(--red)' : 'var(--text3)', fontWeight: isOverdue ? 700 : 400 }}>
          {isDone ? `Done ${new Date(ci.completed_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : new Date(ci.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
          Manager: {ci.manager?.full_name || '—'}
        </div>
      </div>
    </div>
  )
}
