'use client'

import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import InviteUserModal from '@/components/platform/InviteUserModal'
import EditEmployeeModal from '@/components/platform/EditEmployeeModal'
import { useT } from '@/lib/i18n/context'

// ── Types ──────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  full_name: string
  email: string
  role: 'new_hire' | 'manager' | 'hr'
  department: string
  avatar_url?: string
  active: boolean
  created_at: string
}

interface Journey {
  employee_id: string
  status: 'active' | 'at_risk' | 'completed' | 'paused'
  current_week: number
  start_date: string
  template?: { duration_days?: number } | { duration_days?: number }[] | null
}

interface Props {
  profiles: Profile[]
  managers: { id: string; full_name: string }[]
  templates: { id: string; name: string }[]
  journeys: Journey[]
  roleplayCounts?: Record<string, number>
}

// ── Config ─────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  new_hire: { label: 'New Hire', color: 'var(--cyan)',   bg: 'var(--cyan-light)',  icon: 'fa-solid fa-person' },
  manager:  { label: 'Manager',  color: 'var(--blue)',   bg: 'var(--blue-light)',  icon: 'fa-solid fa-user-tie' },
  hr:       { label: 'HR',       color: 'var(--aqua)',   bg: 'var(--aqua-light)',  icon: 'fa-solid fa-id-badge' },
}

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: 'var(--green)',  bg: 'var(--green-bg)',  icon: 'fa-solid fa-circle-play' },
  at_risk:   { label: 'At Risk',   color: 'var(--red)',    bg: 'var(--red-bg)',    icon: 'fa-solid fa-triangle-exclamation' },
  completed: { label: 'Completed', color: 'var(--blue)',   bg: 'var(--blue-light)', icon: 'fa-solid fa-circle-check' },
  paused:    { label: 'Paused',    color: 'var(--amber)',  bg: 'var(--amber-bg)',  icon: 'fa-solid fa-circle-pause' },
}

const DEPT_COLORS: Record<string, string> = {
  Engineering: 'var(--cyan)',
  Product: 'var(--blue)',
  Sales: 'var(--green)',
  People: 'var(--aqua)',
  Design: 'var(--purple)',
  Data: 'var(--amber)',
}

function getJourneyDurationWeeks(journey: Journey): number {
  const tpl = Array.isArray(journey.template) ? journey.template[0] : journey.template
  return tpl?.duration_days ? Math.round(tpl.duration_days / 7) : 12
}

function getJourneyProgress(journey: Journey) {
  return Math.min(100, Math.round((journey.current_week / getJourneyDurationWeeks(journey)) * 100))
}

function getDaysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function exportEmployeesCSV(profiles: Profile[], journeyMap: Record<string, Journey>) {
  const rows = [
    ['Name', 'Email', 'Role', 'Department', 'Status', 'Journey Status', 'Week', 'Journey Progress', 'Started'],
    ...profiles.map(p => {
      const j = journeyMap[p.id]
      return [
        p.full_name,
        p.email,
        ROLE_CONFIG[p.role]?.label || p.role,
        p.department || '',
        p.active ? 'Active' : 'Inactive',
        j ? STATUS_CONFIG[j.status]?.label || j.status : '',
        j ? String(j.current_week) : '',
        j ? `${getJourneyProgress(j)}%` : '',
        j ? j.start_date : '',
      ]
    }),
  ]
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function EmployeesClient({ profiles: dbProfiles, managers, templates, journeys: dbJourneys, roleplayCounts = {} }: Props) {
  const router = useRouter()
  const { t } = useT()
  const [showInvite, setShowInvite]         = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null)
  const [search, setSearch]                 = useState('')
  const [filterRole, setFilterRole]         = useState<'all' | 'new_hire' | 'manager' | 'hr'>('all')
  const [filterStatus, setFilterStatus]     = useState<'all' | 'active' | 'inactive'>('all')
  const [filterDept, setFilterDept]         = useState<string>('all')
  const [page, setPage]                     = useState(0)
  const PAGE_SIZE = 10

  const profiles = dbProfiles
  const journeys = dbJourneys

  // Index journeys by employee_id
  const journeyMap = useMemo(() => {
    const m: Record<string, Journey> = {}
    journeys.forEach(j => { m[j.employee_id] = j })
    return m
  }, [journeys])

  // Departments list
  const departments = useMemo(() => {
    const s = new Set<string>()
    profiles.forEach(p => { if (p.department) s.add(p.department) })
    return Array.from(s).sort()
  }, [profiles])

  // KPIs
  const total       = profiles.length
  const newHires    = profiles.filter(p => p.role === 'new_hire').length
  const activeJourneys = journeys.filter(j => j.status === 'active' || j.status === 'at_risk').length
  const atRisk      = journeys.filter(j => j.status === 'at_risk').length

  // Filtered list — reset page whenever filters change
  const filtered = useMemo(() => {
    setPage(0)
    return profiles.filter(p => {
      if (filterRole !== 'all' && p.role !== filterRole) return false
      if (filterStatus === 'active' && !p.active) return false
      if (filterStatus === 'inactive' && p.active) return false
      if (filterDept !== 'all' && p.department !== filterDept) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!p.full_name.toLowerCase().includes(q) && !p.email.toLowerCase().includes(q) && !(p.department || '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [profiles, filterRole, filterStatus, filterDept, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <>
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>{t('hr.employees.title')}</h1>
          <p>{t('hr.employees.subtitle')}</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => exportEmployeesCSV(filtered, journeyMap)} aria-label="Export employee list as CSV">
            <i className="fa-solid fa-download" aria-hidden="true" /> Export
          </button>
          <button className="btn btn-primary btn-sm btn-glow" onClick={() => setShowInvite(true)} aria-label="Invite a new team member">
            <i className="fa-solid fa-user-plus" aria-hidden="true" /> {t('hr.employees.inviteBtn')}
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPI Row */}
        <div className="kpi-row">
          {[
            { label: t('hr.employees.totalEmployees'), value: total,          icon: 'fa-solid fa-users',                      colorClass: 'blue'  },
            { label: t('hr.employees.avgProgress'),    value: newHires,       icon: 'fa-solid fa-person-walking-arrow-right', colorClass: 'cyan'  },
            { label: t('hr.employees.activeJourneys'), value: activeJourneys, icon: 'fa-solid fa-route',                      colorClass: 'green' },
            { label: t('hr.employees.atRisk'),         value: atRisk,         icon: 'fa-solid fa-triangle-exclamation',       colorClass: atRisk > 0 ? 'red' : 'green' },
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

        {/* Search + Filter Bar */}
        <div className="db-card" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
              <i className="fa-solid fa-magnifying-glass" style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, color: 'var(--text3)',
              }} />
              <input
                type="text"
                placeholder={t('hr.employees.searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', paddingLeft: 34, paddingRight: 12, height: 34,
                  border: '1.5px solid var(--border)', borderRadius: 'var(--r)',
                  background: 'var(--bg)', color: 'var(--text)',
                  fontSize: 12, outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>

            <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

            {/* Role filter */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'new_hire', 'manager', 'hr'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  style={{
                    padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                    border: '1px solid',
                    borderColor: filterRole === r ? 'var(--blue)' : 'var(--border)',
                    background: filterRole === r ? 'var(--blue-light)' : 'transparent',
                    color: filterRole === r ? 'var(--blue)' : 'var(--text3)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {r === 'all' ? t('hr.employees.filterAll') : r === 'hr' ? t('hr.employees.filterHR') : r === 'manager' ? t('hr.employees.filterManager') : t('hr.employees.filterNewHire')}
                </button>
              ))}
            </div>

            <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

            {/* Status filter */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'active', 'inactive'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                    border: '1px solid',
                    borderColor: filterStatus === s ? 'var(--aqua)' : 'var(--border)',
                    background: filterStatus === s ? 'var(--aqua-light)' : 'transparent',
                    color: filterStatus === s ? 'var(--aqua)' : 'var(--text3)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Department select */}
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
              <option value="all">All Depts</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* Result count */}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Employee Table */}
        {filtered.length === 0 ? (
          <div className="db-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <i className="fa-solid fa-users-slash" style={{ fontSize: 32, color: 'var(--text3)', display: 'block', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{t('hr.employees.noEmployees')}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Try adjusting your search or filters above.</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
              <i className="fa-solid fa-user-plus" /> {t('hr.employees.inviteBtn')}
            </button>
          </div>
        ) : (
          <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                    {[t('common.name'), t('common.role'), t('common.department'), t('hr.employees.activeJourneys'), t('hr.employees.avgProgress'), t('common.status'), ''].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', textAlign: 'left',
                        fontSize: 10, fontWeight: 800, color: 'var(--text3)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p, i) => {
                    const journey = journeyMap[p.id]
                    const rc = ROLE_CONFIG[p.role] || ROLE_CONFIG.new_hire
                    const sc = journey ? STATUS_CONFIG[journey.status] : null
                    const progress = journey ? getJourneyProgress(journey) : null
                    const deptColor = DEPT_COLORS[p.department] || 'var(--blue)'
                    const daysSince = getDaysSince(p.created_at)

                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        style={{
                          borderBottom: i < paginated.length - 1 ? '1px solid var(--border)' : 'none',
                          opacity: p.active ? 1 : 0.55,
                        }}
                      >
                        {/* Employee */}
                        <td style={{ padding: '14px 16px', minWidth: 220 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <img
                                src={p.avatar_url || `https://i.pravatar.cc/150?u=${p.id}`}
                                alt={p.full_name}
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                              />
                              {!p.active && (
                                <div style={{
                                  position: 'absolute', bottom: -2, right: -2,
                                  width: 12, height: 12, borderRadius: '50%',
                                  background: 'var(--red)', border: '2px solid var(--surface)',
                                }} />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {p.full_name}
                                {!p.active && (
                                  <span style={{
                                    fontSize: 9, fontWeight: 800,
                                    color: 'var(--red)', background: 'var(--red-bg)',
                                    padding: '1px 6px', borderRadius: 100,
                                  }}>
                                    INACTIVE
                                  </span>
                                )}
                                {p.role === 'manager' && (roleplayCounts[p.id] ?? 0) > 0 && (
                                  <span title={`${roleplayCounts[p.id]} roleplay scenario${roleplayCounts[p.id] !== 1 ? 's' : ''} completed`} style={{
                                    fontSize: 9, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3,
                                    color: 'var(--purple)', background: 'color-mix(in srgb, var(--purple) 12%, transparent)',
                                    padding: '1px 7px', borderRadius: 100, border: '1px solid color-mix(in srgb, var(--purple) 25%, transparent)',
                                  }}>
                                    <i className="fa-solid fa-masks-theater" style={{ fontSize: 8 }} />
                                    {roleplayCounts[p.id]} roleplay{roleplayCounts[p.id] !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{p.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 11, fontWeight: 700, padding: '3px 10px',
                            borderRadius: 100, color: rc.color, background: rc.bg,
                          }}>
                            <i className={rc.icon} style={{ fontSize: 9 }} />
                            {rc.label}
                          </span>
                        </td>

                        {/* Department */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: 12, fontWeight: 600, color: deptColor,
                          }}>
                            {p.department || <span style={{ color: 'var(--text3)', fontWeight: 400 }}>—</span>}
                          </span>
                        </td>

                        {/* Journey info */}
                        <td style={{ padding: '14px 16px', minWidth: 100 }}>
                          {journey ? (
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                                Week {journey.current_week} / {getJourneyDurationWeeks(journey)}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
                                Day {getDaysSince(journey.start_date)}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                              {p.role === 'new_hire' ? t('hr.employees.journeyNotStarted') : '—'}
                            </span>
                          )}
                        </td>

                        {/* Progress */}
                        <td style={{ padding: '14px 16px', minWidth: 130 }}>
                          {progress !== null ? (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 10, color: 'var(--text3)' }}>
                                  {progress === 100 ? 'Complete' : `${progress}%`}
                                </span>
                              </div>
                              <div style={{ height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', borderRadius: 100,
                                  width: `${progress}%`,
                                  background: journey?.status === 'at_risk'
                                    ? 'var(--red)'
                                    : progress === 100
                                    ? 'var(--green)'
                                    : 'var(--grad)',
                                  transition: 'width 0.5s ease',
                                }} />
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          {sc ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 11, fontWeight: 700, padding: '3px 10px',
                              borderRadius: 100, color: sc.color, background: sc.bg,
                            }}>
                              <i className={sc.icon} style={{ fontSize: 9 }} />
                              {sc.label}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                              {p.role === 'new_hire' ? 'No journey' : '—'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {p.role === 'new_hire' && journey && (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => router.push(`/hr/employees/${p.id}`)}
                                style={{ fontSize: 11 }}
                              >
                                <i className="fa-solid fa-route" /> {t('hr.employees.viewJourney')}
                              </button>
                            )}
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditingEmployee({ ...p, active: p.active ?? true })}
                              style={{ fontSize: 11, color: 'var(--text3)' }}
                              title={t('hr.employees.editEmployee')}
                            >
                              <i className="fa-solid fa-pen" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer: pagination + summary */}
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} members
              </span>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11 }}
                    disabled={page === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    aria-label="Previous page"
                  >
                    <i className="fa-solid fa-chevron-left" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      style={{
                        minWidth: 28, height: 28, borderRadius: 'var(--r)', fontSize: 11, fontWeight: 700,
                        border: '1px solid',
                        borderColor: page === i ? 'var(--blue)' : 'var(--border)',
                        background: page === i ? 'var(--blue-light)' : 'transparent',
                        color: page === i ? 'var(--blue)' : 'var(--text3)',
                        cursor: 'pointer',
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11 }}
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    aria-label="Next page"
                  >
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                </div>
              )}

              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--text3)' }} onClick={() => exportEmployeesCSV(filtered, journeyMap)}>
                <i className="fa-solid fa-download" /> Export CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showInvite && (
          <InviteUserModal
            managers={managers}
            templates={templates}
            onClose={() => setShowInvite(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingEmployee && (
          <EditEmployeeModal
            employee={editingEmployee}
            managers={managers}
            onClose={() => setEditingEmployee(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
