'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import RiskScoreCard from '@/components/ai/RiskScoreCard'

// ── Types ──────────────────────────────────────────────────────────────────

interface AtRiskJourney {
  id: string
  risk_score: number
  risk_reasons: string[]
  current_week: number
  start_date: string
  status: string
  employee: { id: string; full_name: string; department: string; avatar_url?: string }
  manager: { id: string; full_name: string }
}

interface OverdueCheckIn {
  id: string
  milestone: string
  scheduled_date: string
  employee_name: string
  department: string
  manager_name: string
}

interface Notification {
  id: string
  type: 'milestone' | 'task' | 'info' | 'risk'
  title: string
  message: string
  created_at: string
  read: boolean
}

interface Props {
  atRisk: AtRiskJourney[]
  overdueCheckIns: OverdueCheckIn[]
  notifications: Notification[]
}

// ── Config ─────────────────────────────────────────────────────────────────

const MILESTONE_LABELS: Record<string, string> = {
  day_7: 'Day 7', day_30: 'Day 30', day_60: 'Day 60', day_90: 'Day 90',
}

const NOTIF_CONFIG = {
  milestone: { color: 'var(--blue)',  bg: 'var(--blue-light)', icon: 'fa-solid fa-flag-checkered' },
  task:      { color: 'var(--amber)', bg: 'var(--amber-bg)',   icon: 'fa-solid fa-list-check'     },
  info:      { color: 'var(--cyan)',  bg: 'var(--cyan-light)', icon: 'fa-solid fa-circle-info'    },
  risk:      { color: 'var(--red)',   bg: 'var(--red-bg)',     icon: 'fa-solid fa-triangle-exclamation' },
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Alert Settings State ──────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  push:          true,
  weeklySummary: true,
  slackAlerts:   false,
  emailDigest:   true,
  riskThreshold: 60,
}

// ── Main Component ─────────────────────────────────────────────────────────

type FilterSeverity = 'all' | 'critical' | 'warning' | 'info'

export default function AlertsClient({ atRisk, overdueCheckIns, notifications }: Props) {
  const router = useRouter()
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all')
  const [filterDept, setFilterDept]         = useState('all')
  const [dismissed, setDismissed]           = useState<string[]>([])
  const [resolvedCI, setResolvedCI]         = useState<string[]>([])
  const [readNotifs, setReadNotifs]         = useState<string[]>(notifications.filter(n => n.read).map(n => n.id))
  const [settings, setSettings]             = useState(DEFAULT_SETTINGS)
  const [showSettings, setShowSettings]     = useState(false)
  const [showDeepScan, setShowDeepScan]     = useState(false)
  const [scanning, setScanning]             = useState(false)
  const [scanDone, setScanDone]             = useState(false)

  // ── Derived data ────────────────────────────────────────────────────────

  const departments = useMemo(() => {
    const s = new Set<string>()
    atRisk.forEach(j => { if (j.employee?.department) s.add(j.employee.department) })
    overdueCheckIns.forEach(ci => { if (ci.department) s.add(ci.department) })
    return Array.from(s).sort()
  }, [atRisk, overdueCheckIns])

  const critical = atRisk.filter(j => j.risk_score > 60 && !dismissed.includes(j.id))
  const warning  = atRisk.filter(j => j.risk_score > 40 && j.risk_score <= 60 && !dismissed.includes(j.id))
  const activeOverdue = overdueCheckIns.filter(ci => !resolvedCI.includes(ci.id))
  const unreadNotifs = notifications.filter(n => !readNotifs.includes(n.id)).length

  const filteredRisk = useMemo(() => {
    return atRisk.filter(j => {
      if (dismissed.includes(j.id)) return false
      if (filterSeverity === 'critical' && j.risk_score <= 60) return false
      if (filterSeverity === 'warning'  && (j.risk_score <= 40 || j.risk_score > 60)) return false
      if (filterDept !== 'all' && j.employee?.department !== filterDept) return false
      return true
    })
  }, [atRisk, dismissed, filterSeverity, filterDept])

  // Total actionable alerts
  const totalAlerts = critical.length + warning.length + activeOverdue.length

  // ── AI insight ──────────────────────────────────────────────────────────
  const aiInsight = critical.length > 0
    ? `${critical.length} employee${critical.length > 1 ? 's are' : ' is'} critically at risk. ${activeOverdue.length > 0 ? `${activeOverdue.length} check-in${activeOverdue.length > 1 ? 's are' : ' is'} overdue.` : ''} Immediate action recommended.`
    : atRisk.length > 0
    ? `${warning.length} employee${warning.length > 1 ? 's need' : ' needs'} attention. Run a Deep Scan for updated AI-powered recommendations.`
    : 'All active journeys are within acceptable risk thresholds. Keep monitoring weekly.'

  // ── Deep Scan handler ────────────────────────────────────────────────────
  function handleDeepScan() {
    setShowDeepScan(true)
    setScanning(true)
    setScanDone(false)
    setTimeout(() => {
      setScanning(false)
      setScanDone(true)
    }, 2800)
  }

  function toggleSetting(key: keyof typeof settings) {
    if (typeof settings[key] === 'boolean') {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }
  }

  return (
    <>
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>Active Alerts</h1>
          <p>Critical risks, overdue check-ins, and system notifications across all journeys.</p>
        </div>
        <div className="db-header-actions">
          {unreadNotifs > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '4px 10px',
              borderRadius: 100, background: 'var(--red-bg)', color: 'var(--red)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <i className="fa-solid fa-bell" style={{ marginRight: 5 }} aria-hidden="true" />
              {unreadNotifs} unread
            </span>
          )}
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowSettings(true)}
            aria-label="Open alert settings"
          >
            <i className="fa-solid fa-sliders" aria-hidden="true" /> Settings
          </button>
          <button
            className="btn btn-primary btn-sm btn-glow"
            onClick={handleDeepScan}
            aria-label="Run a deep risk scan"
          >
            <i className="fa-solid fa-bolt" aria-hidden="true" /> Run Deep Scan
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* AI Insight */}
        <div style={{
          background: 'var(--grad-soft)', border: '1px solid var(--blue-light)',
          borderRadius: 'var(--r-xl)', padding: '14px 18px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--r)', background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="fa-solid fa-sparkles" style={{ fontSize: 13, color: '#fff' }} />
          </div>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 800, marginBottom: 4,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: 'var(--grad)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              AI Insight
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{aiInsight}</p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="kpi-row">
          {[
            { label: 'Total Alerts',     value: totalAlerts,          icon: 'fa-solid fa-bell',                   colorClass: totalAlerts > 0 ? 'red' : 'green' },
            { label: 'Critical Risk',    value: critical.length,      icon: 'fa-solid fa-triangle-exclamation',   colorClass: critical.length > 0 ? 'red' : 'green' },
            { label: 'Needs Attention',  value: warning.length,       icon: 'fa-solid fa-circle-exclamation',     colorClass: warning.length > 0 ? 'amber' : 'green' },
            { label: 'Overdue Check-ins',value: activeOverdue.length, icon: 'fa-solid fa-calendar-xmark',        colorClass: activeOverdue.length > 0 ? 'amber' : 'green' },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className={`kpi-icon ${k.colorClass}`}>
                <i className={k.icon} aria-hidden="true" />
              </div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="db-card" style={{ padding: '12px 18px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filter
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {([
                { id: 'all',      label: 'All',       color: 'var(--blue)'  },
                { id: 'critical', label: 'Critical',  color: 'var(--red)'   },
                { id: 'warning',  label: 'Warning',   color: 'var(--amber)' },
                { id: 'info',     label: 'Info',      color: 'var(--cyan)'  },
              ] as const).map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterSeverity(f.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                    border: '1px solid',
                    borderColor: filterSeverity === f.id ? f.color : 'var(--border)',
                    background: filterSeverity === f.id ? f.color + '20' : 'transparent',
                    color: filterSeverity === f.id ? f.color : 'var(--text3)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              style={{
                fontSize: 11, fontWeight: 700, padding: '5px 10px',
                borderRadius: 100, border: '1px solid var(--border)',
                background: filterDept !== 'all' ? 'var(--grad-soft)' : 'transparent',
                color: 'var(--text2)', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
              {filteredRisk.length + (filterSeverity === 'all' || filterSeverity === 'info' ? activeOverdue.length : 0)} alerts
            </span>
          </div>
        </div>

        {/* Main two-col layout */}
        <div className="db-grid-1-360">

          {/* Left — Risk alerts + Overdue check-ins */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Risk section */}
            {(filterSeverity === 'all' || filterSeverity === 'critical' || filterSeverity === 'warning') && (
              <>
                {filteredRisk.length === 0 && filterSeverity !== 'all' ? (
                  <div className="db-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
                    <i className="fa-solid fa-circle-check" style={{ fontSize: 28, color: 'var(--green)', display: 'block', marginBottom: 10 }} />
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>No alerts for this filter</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Try selecting a different severity or department.</div>
                  </div>
                ) : filteredRisk.length > 0 ? (
                  <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--red)', fontSize: 12 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>
                        Risk Alerts ({filteredRisk.length})
                      </span>
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {filteredRisk.map(j => (
                        <div key={j.id} style={{ position: 'relative' }}>
                          <RiskScoreCard
                            employeeName={j.employee?.full_name || 'Unknown'}
                            department={j.employee?.department || ''}
                            score={j.risk_score}
                            currentWeek={j.current_week}
                            reasons={j.risk_reasons || []}
                            avatarUrl={j.employee?.avatar_url}
                            employeeId={j.employee?.id}
                            onViewJourney={() => router.push(`/hr/employees/${j.employee?.id}`)}
                          />
                          <button
                            onClick={() => setDismissed(d => [...d, j.id])}
                            title="Dismiss alert"
                            style={{
                              position: 'absolute', top: 12, right: 12,
                              background: 'var(--surface)', border: '1px solid var(--border)',
                              borderRadius: 'var(--r)', width: 26, height: 26,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: 'var(--text3)', fontSize: 10,
                              zIndex: 1,
                            }}
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {/* Overdue check-ins */}
            {(filterSeverity === 'all' || filterSeverity === 'warning') && activeOverdue.length > 0 && (
              <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--amber-bg)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fa-solid fa-calendar-xmark" style={{ color: 'var(--amber)', fontSize: 12 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)' }}>
                    Overdue Check-ins ({activeOverdue.length})
                  </span>
                </div>
                {activeOverdue.map((ci, i) => (
                  <div
                    key={ci.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 20px',
                      borderBottom: i < activeOverdue.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--r)',
                      background: 'var(--amber-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <i className="fa-solid fa-calendar-xmark" style={{ fontSize: 14, color: 'var(--amber)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {MILESTONE_LABELS[ci.milestone] || ci.milestone} Check-in
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                        {ci.employee_name} · {ci.department} · Manager: {ci.manager_name}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)' }}>
                        Due {fmtDate(ci.scheduled_date)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                        {Math.floor((Date.now() - new Date(ci.scheduled_date).getTime()) / 86400000)}d overdue
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 11 }}
                        onClick={() => router.push('/hr/tasks')}
                      >
                        <i className="fa-solid fa-calendar-plus" /> Schedule
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 10, color: 'var(--text3)' }}
                        title="Mark as resolved"
                        onClick={() => setResolvedCI(r => [...r, ci.id])}
                      >
                        <i className="fa-solid fa-check" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All-clear state */}
            {totalAlerts === 0 && (
              <div className="db-card" style={{ textAlign: 'center', padding: '56px 24px' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', background: 'var(--green-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <i className="fa-solid fa-shield-check" style={{ fontSize: 24, color: 'var(--green)' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                  All Clear
                </div>
                <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
                  No active alerts. All journeys are within acceptable risk thresholds.
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Notification feed */}
            <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fa-solid fa-bell" style={{ color: 'var(--blue)', fontSize: 12 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>Notifications</span>
                  {unreadNotifs > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 100,
                      background: 'var(--red)', color: '#fff',
                    }}>
                      {unreadNotifs}
                    </span>
                  )}
                </div>
                {unreadNotifs > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 10, color: 'var(--text3)', padding: '3px 8px' }}
                    onClick={() => setReadNotifs(notifications.map(n => n.id))}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n, i) => {
                  const nc    = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.info
                  const isNew = !readNotifs.includes(n.id)
                  return (
                    <div
                      key={n.id}
                      onClick={() => setReadNotifs(r => r.includes(n.id) ? r : [...r, n.id])}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 18px',
                        borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                        background: isNew ? 'var(--grad-soft)' : 'transparent',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: 'var(--r)',
                        background: nc.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        marginTop: 1,
                      }}>
                        <i className={nc.icon} style={{ fontSize: 11, color: nc.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: isNew ? 700 : 600,
                          color: 'var(--text)', marginBottom: 2,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          {n.title}
                          {isNew && (
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: 'var(--blue)', flexShrink: 0,
                            }} />
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* AI Strategy card */}
            <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-robot" style={{ color: 'var(--cyan)', fontSize: 12 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>AI Strategy</span>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {critical.length > 0 && (
                  <div style={{
                    padding: '10px 12px', background: 'var(--amber-bg)',
                    borderRadius: 'var(--r)', borderLeft: '3px solid var(--amber)',
                    fontSize: 12, color: 'var(--text2)', lineHeight: 1.5,
                  }}>
                    <strong style={{ display: 'block', marginBottom: 3, color: 'var(--amber)' }}>
                      <i className="fa-solid fa-lightbulb" style={{ marginRight: 5 }} />Action Recommended
                    </strong>
                    Schedule an adaptive culture alignment session for <strong>{critical[0].employee?.full_name}</strong>. Signals suggest integration friction.
                  </div>
                )}
                {activeOverdue.length > 0 && (
                  <div style={{
                    padding: '10px 12px', background: 'var(--red-bg)',
                    borderRadius: 'var(--r)', borderLeft: '3px solid var(--red)',
                    fontSize: 12, color: 'var(--text2)', lineHeight: 1.5,
                  }}>
                    <strong style={{ display: 'block', marginBottom: 3, color: 'var(--red)' }}>
                      <i className="fa-solid fa-calendar-xmark" style={{ marginRight: 5 }} />Overdue Check-ins
                    </strong>
                    {activeOverdue.length} check-in{activeOverdue.length > 1 ? 's are' : ' is'} overdue. Manager follow-up needed within 24h.
                  </div>
                )}
                <div style={{
                  padding: '10px 12px', background: 'var(--blue-light)',
                  borderRadius: 'var(--r)', borderLeft: '3px solid var(--blue)',
                  fontSize: 12, color: 'var(--text2)', lineHeight: 1.5,
                }}>
                  <strong style={{ display: 'block', marginBottom: 3, color: 'var(--blue)' }}>
                    <i className="fa-solid fa-circle-info" style={{ marginRight: 5 }} />System Note
                  </strong>
                  Run a Deep Scan to refresh risk scores and get AI-powered recommendations for each flagged employee.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deep Scan Modal */}
      <AnimatePresence>
        {showDeepScan && (
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(13,21,41,0.5)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: 20,
            }}
            onClick={() => !scanning && setShowDeepScan(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 420,
                background: 'var(--surface)',
                borderRadius: 'var(--r-xl)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r)', background: scanning ? 'var(--grad-soft)' : scanDone ? 'var(--green-bg)' : 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`fa-solid ${scanning ? 'fa-bolt fa-spin' : scanDone ? 'fa-circle-check' : 'fa-bolt'}`} style={{ fontSize: 16, color: scanning ? 'var(--blue)' : scanDone ? 'var(--green)' : 'var(--red)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
                    {scanning ? 'Running Deep Scan...' : scanDone ? 'Scan Complete' : 'Deep Scan'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    {scanning ? 'Analyzing all active journeys...' : scanDone ? 'Risk scores have been updated.' : 'AI-powered risk analysis'}
                  </div>
                </div>
              </div>
              <div style={{ padding: '24px' }}>
                {scanning ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {['Fetching journey data', 'Analyzing engagement signals', 'Computing risk scores', 'Generating recommendations'].map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 11, color: 'var(--blue)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--text2)' }}>{step}...</span>
                      </div>
                    ))}
                  </div>
                ) : scanDone ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <i className="fa-solid fa-circle-check" style={{ fontSize: 22, color: 'var(--green)' }} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                      {atRisk.length} journey{atRisk.length !== 1 ? 's' : ''} analyzed
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.5 }}>
                      Risk scores updated. {critical.length > 0 ? `${critical.length} critical alert${critical.length > 1 ? 's' : ''} require immediate attention.` : 'All scores within thresholds.'}
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => setShowDeepScan(false)}>
                      <i className="fa-solid fa-check" /> Done
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(13,21,41,0.45)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000, padding: 20,
            }}
            onClick={e => e.target === e.currentTarget && setShowSettings(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 440,
                background: 'var(--surface)',
                borderRadius: 'var(--r-xl)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r)', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fa-solid fa-sliders" style={{ fontSize: 16, color: 'var(--blue)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Alert Settings</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Configure how you receive alerts</div>
                </div>
                <button onClick={() => setShowSettings(false)} className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)', padding: '6px 8px' }}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {([
                  { key: 'push'         as const, label: 'Push Notifications',              desc: 'Real-time alerts in the browser' },
                  { key: 'weeklySummary'as const, label: 'Weekly Risk Summary',             desc: 'Email digest every Monday morning' },
                  { key: 'emailDigest'  as const, label: 'Email Digest',                    desc: 'Daily summary of all alerts' },
                  { key: 'slackAlerts'  as const, label: 'Department Slack Alerts',         desc: 'Route alerts to Slack by department' },
                ]).map((item, i, arr) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.desc}</div>
                    </div>
                    <button
                      onClick={() => toggleSetting(item.key)}
                      style={{
                        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                        background: settings[item.key] ? 'var(--blue)' : 'var(--border2)',
                        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3,
                        left: settings[item.key] ? 23 : 3,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#fff', transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </div>
                ))}

                {/* Risk threshold */}
                <div style={{ paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Risk Alert Threshold</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Alert when risk score exceeds this value</div>
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)',
                      color: settings.riskThreshold > 70 ? 'var(--red)' : settings.riskThreshold > 50 ? 'var(--amber)' : 'var(--green)',
                    }}>
                      {settings.riskThreshold}
                    </span>
                  </div>
                  <input
                    type="range" min={20} max={90} step={5}
                    value={settings.riskThreshold}
                    onChange={e => setSettings(p => ({ ...p, riskThreshold: Number(e.target.value) }))}
                    style={{ width: '100%', accentColor: 'var(--blue)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                    <span>Sensitive (20)</span>
                    <span>Conservative (90)</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', gap: 10 }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setShowSettings(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" style={{ flex: 2 }} onClick={() => setShowSettings(false)}>
                  <i className="fa-solid fa-floppy-disk" /> Save Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
