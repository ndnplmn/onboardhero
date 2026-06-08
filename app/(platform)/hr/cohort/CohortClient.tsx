'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CohortRow {
  id:              string
  name:            string
  dept:            string
  avatarUrl:       string | null
  managerName:     string
  week:            number
  riskScore:       number
  sentiment:       number | null
  status:          string
  taskProgress:    number
  pendingCheckIns: number
  startDate:       string
}

interface RetentionFunnel {
  total: number
  day30: { count: number; pct: number }
  day60: { count: number; pct: number }
  day90: { count: number; pct: number }
}

interface DeptBreakdown {
  dept:    string
  total:   number
  atRisk:  number
  avgRisk: number
}

interface LastMonthDeltas {
  total:   number
  atRisk:  number
  onTrack: number
}

interface CohortClientProps {
  rows:              CohortRow[]
  retentionFunnel?:  RetentionFunnel
  deptBreakdown?:    DeptBreakdown[]
  lastMonthDeltas?:  LastMonthDeltas | null
}

type SortKey = 'name' | 'week' | 'riskScore' | 'taskProgress' | 'pendingCheckIns'

function riskConfig(score: number) {
  if (score >= 70) return { label: 'High',   color: 'var(--red)',   bg: 'var(--red-bg)'   }
  if (score >= 40) return { label: 'Medium', color: 'var(--amber)', bg: 'var(--amber-bg)' }
  return               { label: 'Low',    color: 'var(--green)', bg: 'var(--green-bg)' }
}

function exportCSV(rows: CohortRow[]) {
  const header = ['Name', 'Department', 'Manager', 'Week', 'Risk Score', 'Task Progress', 'Pending Check-ins', 'Status', 'Start Date']
  const data   = rows.map(r => [r.name, r.dept, r.managerName, r.week, r.riskScore, `${r.taskProgress}%`, r.pendingCheckIns, r.status, r.startDate])
  const csv    = [header, ...data].map(row => row.join(',')).join('\n')
  const blob   = new Blob([csv], { type: 'text/csv' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = `cohort-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function DeltaBadge({ delta, inverse = false }: { delta: number; inverse?: boolean }) {
  if (delta === 0) return <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>= last mo.</span>
  const positive = inverse ? delta < 0 : delta > 0
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: positive ? 'var(--green)' : 'var(--red)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <i className={`fa-solid fa-arrow-${delta > 0 ? 'up' : 'down'}`} style={{ fontSize: 8 }} />
      {Math.abs(delta)} vs last mo.
    </span>
  )
}

export default function CohortClient({ rows, retentionFunnel, deptBreakdown, lastMonthDeltas }: CohortClientProps) {
  const router = useRouter()
  const [sortKey, setSortKey]       = useState<SortKey>('riskScore')
  const [sortAsc, setSortAsc]       = useState(false)
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [toastMsg, setToastMsg]     = useState<string | null>(null)
  const [sending, setSending]       = useState(false)

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 2500)
    return () => clearTimeout(t)
  }, [toastMsg])

  const depts    = [...new Set(rows.map(r => r.dept).filter(Boolean))].sort()
  const statuses = [...new Set(rows.map(r => r.status))]

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(r => r.id)))
    }
  }

  async function sendReminder() {
    if (sending) return
    const ids = [...selected]
    setSending(true)
    try {
      const res = await fetch('/api/hr/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journeyIds: ids }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to send')
      setToastMsg(`Reminders queued for ${json.queued ?? ids.length} ${(json.queued ?? ids.length) === 1 ? 'hire' : 'hires'}`)
      setSelected(new Set())
    } catch {
      setToastMsg('Failed to send reminders — try again')
    } finally {
      setSending(false)
    }
  }

  function exportSelected() {
    exportCSV(rows.filter(r => selected.has(r.id)))
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const filtered = rows
    .filter(r => !filterDept   || r.dept   === filterDept)
    .filter(r => !filterStatus || r.status === filterStatus)
    .sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })

  const atRisk   = rows.filter(r => r.riskScore >= 70).length
  const onTrack  = rows.filter(r => r.riskScore < 40).length
  const avgProgress = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.taskProgress, 0) / rows.length) : 0

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <i className="fa-solid fa-sort" style={{ fontSize: 9, opacity: 0.4 }} />
    return <i className={`fa-solid fa-sort-${sortAsc ? 'up' : 'down'}`} style={{ fontSize: 9, color: 'var(--blue)' }} />
  }

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <div style={{ marginBottom: 6 }}>
            <Link href="/hr/dashboard" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-arrow-left" style={{ fontSize: 10 }} /> Back to Dashboard
            </Link>
          </div>
          <h1>Cohort View</h1>
          <p>All new hires onboarded this month — risk, progress, and pending check-ins at a glance.</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => exportCSV(filtered)}>
            <i className="fa-solid fa-download" /> Export CSV
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPI strip */}
        <div className="db-grid-kpi5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-users" /></div>
            <div className="kpi-value">{rows.length}</div>
            <div className="kpi-label">Hires This Month</div>
            {lastMonthDeltas && <div style={{ marginTop: 4 }}><DeltaBadge delta={lastMonthDeltas.total} /></div>}
          </div>
          <div className="kpi-card">
            <div className="kpi-icon red"><i className="fa-solid fa-triangle-exclamation" /></div>
            <div className="kpi-value">{atRisk}</div>
            <div className="kpi-label">High Risk</div>
            {lastMonthDeltas && <div style={{ marginTop: 4 }}><DeltaBadge delta={lastMonthDeltas.atRisk} inverse /></div>}
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-circle-check" /></div>
            <div className="kpi-value">{onTrack}</div>
            <div className="kpi-label">On Track</div>
            {lastMonthDeltas && <div style={{ marginTop: 4 }}><DeltaBadge delta={lastMonthDeltas.onTrack} /></div>}
          </div>
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-list-check" /></div>
            <div className="kpi-value">{avgProgress}%</div>
            <div className="kpi-label">Avg Task Progress</div>
          </div>
        </div>

        {/* Retention Funnel */}
        {retentionFunnel && retentionFunnel.total > 0 && (
          <div className="pro-max-card" style={{ padding: '20px 24px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Retention Funnel</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Milestone achievement across all {retentionFunnel.total} journeys</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Day 30', data: retentionFunnel.day30, color: 'var(--blue)' },
                { label: 'Day 60', data: retentionFunnel.day60, color: 'var(--amber)' },
                { label: 'Day 90', data: retentionFunnel.day90, color: 'var(--green)' },
              ].map(({ label, data, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, fontSize: 11, fontWeight: 700, color: 'var(--text2)', flexShrink: 0 }}>{label}</div>
                  <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${data.pct}%`, background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color, width: 36, textAlign: 'right', flexShrink: 0 }}>{data.pct}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', width: 60, flexShrink: 0 }}>{data.count} / {retentionFunnel.total}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Breakdown */}
        {deptBreakdown && deptBreakdown.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--gap-standard)' }}>
            {deptBreakdown.map(dept => {
              const riskLevel = dept.avgRisk >= 70 ? 'var(--red)' : dept.avgRisk >= 40 ? 'var(--amber)' : 'var(--green)'
              const riskBg    = dept.avgRisk >= 70 ? 'var(--red-bg)' : dept.avgRisk >= 40 ? 'var(--amber-bg)' : 'var(--green-bg)'
              return (
                <div key={dept.dept} className="pro-max-card" style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dept.dept}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
                      <span>Total hires</span>
                      <span style={{ fontWeight: 700, color: 'var(--text2)' }}>{dept.total}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
                      <span>At risk</span>
                      <span style={{ fontWeight: 700, color: dept.atRisk > 0 ? 'var(--red)' : 'var(--text3)' }}>{dept.atRisk}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                      <span>Avg risk</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: riskBg, color: riskLevel }}>{dept.avgRisk}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            style={{ fontSize: 12, padding: '6px 10px', borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
          >
            <option value="">All Departments</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ fontSize: 12, padding: '6px 10px', borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filterDept || filterStatus) && (
            <button
              onClick={() => { setFilterDept(''); setFilterStatus('') }}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12 }}
            >
              <i className="fa-solid fa-xmark" /> Clear
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>
            {filtered.length} of {rows.length} hires
          </span>
        </div>

        {/* Table */}
        <div className="pro-max-card" style={{ padding: 0, overflow: 'hidden' }}>
          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
              <i className="fa-solid fa-users" style={{ fontSize: 32, opacity: 0.3, display: 'block', marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No new hires this month yet.</p>
              <p style={{ fontSize: 12 }}>Invite new hires from the HR dashboard to see them here.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 12px', width: 40 }}>
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selected.size === filtered.length}
                        ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length }}
                        onChange={toggleAll}
                        style={{ cursor: 'pointer', accentColor: 'var(--blue)' }}
                        aria-label="Select all"
                      />
                    </th>
                    {([
                      { label: 'Hire',            key: 'name'            },
                      { label: 'Week',            key: 'week'            },
                      { label: 'Risk Score',      key: 'riskScore'       },
                      { label: 'Task Progress',   key: 'taskProgress'    },
                      { label: 'Check-ins Due',   key: 'pendingCheckIns' },
                    ] as { label: string; key: SortKey }[]).map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text3)', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}
                      >
                        {col.label} <SortIcon k={col.key} />
                      </th>
                    ))}
                    <th style={{ padding: '10px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text3)' }}>Manager</th>
                    <th style={{ padding: '10px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text3)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, idx) => {
                    const risk      = riskConfig(row.riskScore)
                    const isChecked = selected.has(row.id)
                    return (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                          background: isChecked
                            ? 'color-mix(in srgb, var(--blue) 6%, transparent)'
                            : row.riskScore >= 70 ? 'color-mix(in srgb, var(--red) 3%, transparent)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = isChecked ? 'color-mix(in srgb, var(--blue) 6%, transparent)' : row.riskScore >= 70 ? 'color-mix(in srgb, var(--red) 3%, transparent)' : 'transparent')}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '12px 12px', width: 40 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRow(row.id)}
                            style={{ cursor: 'pointer', accentColor: 'var(--blue)' }}
                            aria-label={`Select ${row.name}`}
                          />
                        </td>

                        {/* Name + dept */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {row.avatarUrl ? (
                              <img src={row.avatarUrl} alt={row.name} style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--blue)' }}>
                                {row.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{row.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{row.dept}</div>
                            </div>
                          </div>
                        </td>

                        {/* Week */}
                        <td style={{ padding: '12px 16px', color: 'var(--text2)', fontWeight: 600 }}>
                          Week {row.week}
                        </td>

                        {/* Risk */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: risk.bg, color: risk.color }}>
                              {risk.label}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: risk.color }}>{row.riskScore}</span>
                          </div>
                        </td>

                        {/* Task progress */}
                        <td style={{ padding: '12px 16px', minWidth: 120 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${row.taskProgress}%`,
                                background: row.taskProgress >= 80 ? 'var(--green)' : row.taskProgress >= 50 ? 'var(--blue)' : 'var(--amber)',
                                borderRadius: 3,
                                transition: 'width 0.4s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', minWidth: 28 }}>{row.taskProgress}%</span>
                          </div>
                        </td>

                        {/* Pending check-ins */}
                        <td style={{ padding: '12px 16px' }}>
                          {row.pendingCheckIns > 0 ? (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)' }}>
                              {row.pendingCheckIns} pending
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
                          )}
                        </td>

                        {/* Manager */}
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>
                          {row.managerName}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => router.push(`/hr/employees/${row.id}`)}
                            style={{ fontSize: 11 }}
                          >
                            View Journey
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px',
          background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border)',
          borderRadius: 99,
          boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
          zIndex: 9999,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', paddingRight: 4 }}>
            {selected.size} {selected.size === 1 ? 'hire' : 'hires'} selected
          </span>
          <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />
          <button
            className="btn btn-sm"
            onClick={sendReminder}
            disabled={sending}
            style={{ fontSize: 11, fontWeight: 700, background: 'var(--grad)', color: '#fff', border: 'none', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 5, opacity: sending ? 0.7 : 1 }}
          >
            <i className={sending ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'} style={{ fontSize: 10 }} />
            {sending ? 'Sending…' : 'Send Reminder'}
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={exportSelected}
            style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <i className="fa-solid fa-download" style={{ fontSize: 10 }} />
            Export Selected
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSelected(new Set())}
            style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}
            aria-label="Clear selection"
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} />
            Clear
          </button>
        </div>
      )}

      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 86, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 18px',
          background: toastMsg.startsWith('Failed') ? 'var(--red)' : 'var(--green)',
          color: '#fff',
          fontSize: 12, fontWeight: 700,
          borderRadius: 99,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 10000,
          display: 'flex', alignItems: 'center', gap: 8,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          <i className={toastMsg.startsWith('Failed') ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-check'} style={{ fontSize: 13 }} />
          {toastMsg}
        </div>
      )}
    </>
  )
}
