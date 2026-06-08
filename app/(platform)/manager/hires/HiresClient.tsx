'use client'

import { useState, useMemo } from 'react'

function RiskScoreCell({ score }: { score: number }) {
  const [expanded, setExpanded] = useState(false)

  const label = score >= 70 ? 'High Risk' : score >= 40 ? 'Moderate' : 'On Track'
  const color = score >= 70 ? 'var(--red)' : score >= 40 ? 'var(--amber)' : 'var(--green)'

  const explanation = score >= 70
    ? 'Multiple friction signals detected. Immediate manager check-in recommended.'
    : score >= 40
    ? 'Some integration challenges detected. Monitor and consider a proactive 1:1.'
    : 'Journey progressing normally. Keep up the cadence.'

  const action = score >= 70
    ? 'Schedule 1:1 today'
    : score >= 40
    ? 'Send a check-in message'
    : 'No action needed'

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
        aria-expanded={expanded}
        aria-label={`Risk score ${score}: ${label}. Click to ${expanded ? 'collapse' : 'expand'} details.`}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase' }}>{label}</span>
        <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: 9, color: 'var(--text3)' }} aria-hidden="true" />
      </button>
      {expanded && (
        <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 'var(--r)', background: score >= 70 ? 'var(--red-bg)' : score >= 40 ? 'var(--amber-bg)' : 'var(--green-bg)', border: `1px solid ${color}22`, maxWidth: 200 }}>
          <p style={{ fontSize: 11, color: 'var(--text2)', margin: '0 0 4px', lineHeight: 1.4 }}>{explanation}</p>
          <span style={{ fontSize: 10, fontWeight: 700, color }}>
            <i className="fa-solid fa-arrow-right" style={{ marginRight: 4 }} aria-hidden="true" />{action}
          </span>
        </div>
      )}
    </div>
  )
}
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ScheduleCheckInModal from '@/components/platform/ScheduleCheckInModal'
import { useT } from '@/lib/i18n/context'

interface Journey {
  id: string
  status: string
  current_week: number
  risk_score: number
  start_date: string
  taskPct: number
  employee: {
    id: string
    full_name: string
    department: string
    avatar_url: string | null
  }
}

interface Kpis {
  totalHires:        number
  activeCount:       number
  atRisk:            number
  completedCount:    number
  avgTaskCompletion: number
  pendingCheckIns:   number
}

interface HiresClientProps {
  journeys: Journey[]
  kpis:     Kpis
  hirees:   { id: string; name: string; role: string }[]
}

type StatusFilter = 'all' | 'active' | 'at-risk' | 'completed'

function RiskBadge({ score }: { score: number }) {
  if (score > 60) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}>
      <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 8 }} /> {score}
    </span>
  )
  if (score > 30) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
      <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 8 }} /> {score}
    </span>
  )
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)' }}>
      <i className="fa-solid fa-circle-check" style={{ fontSize: 8 }} /> {score}
    </span>
  )
}

function StatusBadge({ status, riskScore }: { status: string; riskScore: number }) {
  if (status === 'completed') return (
    <span className="sbadge done">Completed</span>
  )
  if (riskScore > 60) return (
    <span className="sbadge risk">At Risk</span>
  )
  return (
    <span className="sbadge on">On Track</span>
  )
}

function weekLabel(week: number) {
  if (week <= 1)  return 'Week 1'
  if (week <= 4)  return `Week ${week}`
  if (week <= 8)  return 'Month 2'
  return 'Month 3'
}

export default function HiresClient({ journeys, kpis, hirees }: HiresClientProps) {
  const { t } = useT()
  const router = useRouter()
  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState<StatusFilter>('all')
  const [checkInHiree, setCheckInHiree] = useState<{ id: string; name: string; role: string }[] | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return journeys.filter(j => {
      const matchesSearch = !q
        || j.employee.full_name.toLowerCase().includes(q)
        || j.employee.department.toLowerCase().includes(q)
      const isAtRisk   = j.risk_score > 60 && j.status !== 'completed'
      const matchesFilter =
        filter === 'all'       ||
        (filter === 'completed' && j.status === 'completed') ||
        (filter === 'at-risk'   && isAtRisk) ||
        (filter === 'active'    && j.status !== 'completed' && !isAtRisk)
      return matchesSearch && matchesFilter
    })
  }, [journeys, search, filter])

  function openSchedule(journey: Journey) {
    setCheckInHiree([{
      id:   journey.id,
      name: journey.employee.full_name,
      role: journey.employee.department,
    }])
  }

  // Insight card copy driven by real KPIs
  const velocityMsg = kpis.avgTaskCompletion >= 80
    ? `Your team's average task completion is ${kpis.avgTaskCompletion}% — above the company benchmark of 74%.`
    : `Average task completion is ${kpis.avgTaskCompletion}%. Consider scheduling check-ins to unblock stalled tasks.`

  const retentionMsg = kpis.atRisk === 0
    ? `No at-risk signals detected across your ${kpis.activeCount} active hires in the last 7 days.`
    : `${kpis.atRisk} hire${kpis.atRisk > 1 ? 's are' : ' is'} showing risk signals. Early intervention improves 90-day retention by up to 40%.`

  const milestonesMsg = kpis.completedCount > 0
    ? `${kpis.completedCount} hire${kpis.completedCount > 1 ? 's have' : ' has'} completed their 90-day journey. Review their feedback to improve future onboarding.`
    : `No journeys completed yet. Keep tracking weekly progress to reach full integration milestones.`

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>{t('manager.hires.title')}</h1>
          <p>{t('manager.hires.subtitle')}</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setCheckInHiree(hirees)} aria-label="Schedule a check-in with your new hires">
            <i className="fa-solid fa-calendar-check" aria-hidden="true" /> {t('manager.hires.scheduleCheckIn')}
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPIs */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-user-group" /></div>
            <div className="kpi-value">{kpis.totalHires}</div>
            <div className="kpi-label">{t('manager.hires.totalHires')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-road" /></div>
            <div className="kpi-value">{kpis.activeCount}</div>
            <div className="kpi-label">{t('manager.hires.activeJourneys')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon red"><i className="fa-solid fa-triangle-exclamation" /></div>
            <div className="kpi-value">{kpis.atRisk}</div>
            <div className="kpi-label">{t('manager.hires.atRisk')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-circle-check" /></div>
            <div className="kpi-value">{kpis.completedCount}</div>
            <div className="kpi-label">{t('manager.hires.completed')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon aqua"><i className="fa-solid fa-list-check" /></div>
            <div className="kpi-value">{kpis.avgTaskCompletion}%</div>
            <div className="kpi-label">{t('manager.hires.avgCompletion')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon amber"><i className="fa-solid fa-calendar-clock" /></div>
            <div className="kpi-value">{kpis.pendingCheckIns}</div>
            <div className="kpi-label">{t('manager.hires.pendingCheckIns')}</div>
          </div>
        </div>

        {/* Hires Table */}
        <div className="db-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <i className="fa-solid fa-users" style={{ color: 'var(--blue)' }} />
              <h3>Active New Hires</h3>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--blue-light)', color: 'var(--blue)' }}>
                {filtered.length}
              </span>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text3)' }} />
              <input
                type="text"
                placeholder="Search name or dept…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  paddingLeft: 30, paddingRight: 12, height: 32, fontSize: 12,
                  background: 'var(--bg)', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--r)', color: 'var(--text)', outline: 'none', width: 200,
                }}
              />
            </div>

            {/* Status filter */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'active', 'at-risk', 'completed'] as StatusFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="btn btn-sm"
                  style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 'var(--r)',
                    background: filter === f ? 'var(--blue)' : 'var(--surface)',
                    color:      filter === f ? '#fff'        : 'var(--text2)',
                    border:     filter === f ? 'none'        : '1px solid var(--border)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {f === 'all' ? 'All' : f === 'at-risk' ? 'At Risk' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              <i className="fa-solid fa-user-slash" style={{ fontSize: 28, display: 'block', marginBottom: 10, color: 'var(--border)' }} />
              {t('manager.hires.noHires')}
            </div>
          ) : (
            <table className="emp-tbl">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Stage</th>
                  <th>Task Progress</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="sync">
                  {filtered.map((j, i) => (
                    <motion.tr
                      key={j.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      {/* Employee */}
                      <td>
                        <div className="emp-cell">
                          {j.employee.avatar_url ? (
                            <img src={j.employee.avatar_url} alt={j.employee.full_name} />
                          ) : (
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                              background: 'var(--blue-light)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 800, color: 'var(--blue)',
                            }}>
                              {j.employee.full_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <strong>{j.employee.full_name}</strong>
                            <span>New Hire</span>
                          </div>
                        </div>
                      </td>

                      {/* Dept */}
                      <td style={{ color: 'var(--text2)', fontSize: 12 }}>{j.employee.department}</td>

                      {/* Stage */}
                      <td style={{ fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{weekLabel(j.current_week)}</span>
                        <br />
                        <span style={{ fontSize: 10, color: 'var(--text3)' }}>
                          {Math.round((new Date().getTime() - new Date(j.start_date).getTime()) / 86400000)} days in
                        </span>
                      </td>

                      {/* Task progress */}
                      <td className="prog-cell">
                        <em>{j.taskPct}%</em>
                        <div className="pw">
                          <div
                            className={`pf ${j.risk_score > 60 && j.status !== 'completed' ? 'risk' : j.status === 'completed' ? 'done' : ''}`}
                            style={{ width: `${j.taskPct}%` }}
                          />
                        </div>
                      </td>

                      {/* Risk */}
                      <td><RiskScoreCell score={j.risk_score} /></td>

                      {/* Status */}
                      <td><StatusBadge status={j.status} riskScore={j.risk_score} /></td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => router.push(`/manager/team/${j.id}`)}
                            style={{ fontSize: 11 }}
                          >
                            <i className="fa-solid fa-eye" /> {t('manager.hires.viewJourney')}
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openSchedule(j)}
                            style={{ fontSize: 11 }}
                          >
                            <i className="fa-solid fa-calendar-plus" /> {t('manager.hires.scheduleCheckIn')}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Insight Cards */}
        <div className="db-grid-3col">
          <div className="db-card">
            <div className="db-card-hd">
              <h3><i className="fa-solid fa-bolt" style={{ color: 'var(--cyan)' }} /> Integration Velocity</h3>
            </div>
            <div className="db-card-bd">
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                {velocityMsg}
              </p>
            </div>
          </div>

          <div className="db-card" style={{ borderLeft: kpis.atRisk > 0 ? '3px solid var(--red)' : undefined }}>
            <div className="db-card-hd">
              <h3><i className="fa-solid fa-shield-halved" style={{ color: 'var(--blue)' }} /> Retention Signal</h3>
              {kpis.atRisk > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--red-bg)', color: 'var(--red)' }}>
                  {kpis.atRisk} at risk
                </span>
              )}
            </div>
            <div className="db-card-bd">
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                {retentionMsg}
              </p>
              {kpis.atRisk > 0 && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 12, fontSize: 11 }}
                  onClick={() => setCheckInHiree(hirees)}
                >
                  <i className="fa-solid fa-calendar-plus" /> Schedule Intervention
                </button>
              )}
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-hd">
              <h3><i className="fa-solid fa-award" style={{ color: 'var(--aqua)' }} /> Journey Milestones</h3>
            </div>
            <div className="db-card-bd">
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                {milestonesMsg}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Schedule Check-in Modal */}
      <AnimatePresence>
        {checkInHiree && (
          <ScheduleCheckInModal
            hirees={checkInHiree}
            onClose={() => setCheckInHiree(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
