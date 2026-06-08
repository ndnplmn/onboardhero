'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n/context'

export interface Employee {
  id: string
  name: string
  role: string
  dept: string
  days: number
  progress: number
  status: 'on-track' | 'at-risk' | 'completed'
  avatar?: string | null
}

function exportListCSV(employees: Employee[]) {
  const rows = [
    ['Name', 'Role', 'Department', 'Days', 'Progress', 'Status'],
    ...employees.map(e => [e.name, e.role, e.dept, String(e.days), `${e.progress}%`, e.status]),
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `employee-list-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface EmployeeTableProps {
  onInviteNew?: () => void
  employees?: Employee[]
  stageFilter?: string
  externalDeptFilter?: string
}

const STAGE_DAY_RANGES: Record<string, [number, number]> = {
  'Pre-boarding': [0, 0],
  'First Week':   [1, 7],
  'First Month':  [8, 30],
  'Ramp-up':      [31, 999],
}

export default function EmployeeTable({ onInviteNew, employees = [], stageFilter, externalDeptFilter }: EmployeeTableProps) {
  const { t } = useT()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const depts    = [...new Set(employees.map(e => e.dept).filter(Boolean))].sort()
  const statuses: Employee['status'][] = ['on-track', 'at-risk', 'completed']

  const filtered = employees.filter(e => {
    if (search      && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.role.toLowerCase().includes(search.toLowerCase())) return false
    if (filterDept  && e.dept   !== filterDept)   return false
    if (filterStatus && e.status !== filterStatus) return false
    if (stageFilter && STAGE_DAY_RANGES[stageFilter]) {
      const [min, max] = STAGE_DAY_RANGES[stageFilter]
      if (e.days < min || e.days > max) return false
    }
    if (externalDeptFilter && e.dept !== externalDeptFilter) return false
    return true
  })

  const hasFilters = search || filterDept || filterStatus

  return (
    <div className="pro-max-card" style={{ padding: '0px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="db-card-hd" style={{ padding: '24px 24px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-users" style={{ color: 'var(--blue)' }} />
          <h3>{t('components.employeeTable.title')}</h3>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onInviteNew && (
            <button className="btn btn-primary btn-sm" onClick={onInviteNew}>
              <i className="fa-solid fa-user-plus" /> {t('components.employeeTable.addEmployee')}
            </button>
          )}
          {employees.length > 0 && (
            <button className="btn btn-outline btn-sm" onClick={() => exportListCSV(filtered)}>
              <i className="fa-solid fa-download" /> Export List
            </button>
          )}
        </div>
      </div>

      {/* Search + filter bar */}
      {employees.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '0 24px 14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text3)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search by name or role…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: 12, borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {depts.length > 1 && (
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              style={{ fontSize: 12, padding: '6px 10px', borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
            >
              <option value="">All Depts</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ fontSize: 12, padding: '6px 10px', borderRadius: 'var(--r)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s === 'on-track' ? 'On Track' : s === 'at-risk' ? 'At Risk' : 'Completed'}</option>)}
          </select>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => { setSearch(''); setFilterDept(''); setFilterStatus('') }}>
              <i className="fa-solid fa-xmark" /> Clear
            </button>
          )}
          <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>{filtered.length} of {employees.length}</span>
        </div>
      )}

      <div className="db-card-bd emp-tbl-wrap" style={{ padding: 0, flex: 1, overflow: 'auto' }}>
        {employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text3)' }}>
            <i className="fa-solid fa-users" style={{ fontSize: '2rem', marginBottom: 12, display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No active employees yet</p>
            <p style={{ fontSize: 12 }}>Invite new hires to start their onboarding journey.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text3)' }}>
            <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: 24, opacity: 0.35, display: 'block', marginBottom: 10 }} />
            <p style={{ fontSize: 13, fontWeight: 600 }}>No employees match your filters.</p>
          </div>
        ) : (
          <table className="emp-tbl">
            <thead>
              <tr>
                <th>{t('components.employeeTable.name')}</th>
                <th>{t('components.employeeTable.department')}</th>
                <th>{t('components.employeeTable.week')}</th>
                <th>{t('components.employeeTable.risk')}</th>
                <th>{t('components.employeeTable.status')}</th>
                <th>{t('components.employeeTable.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e: Employee) => (
                <tr key={e.id}>
                  <td>
                    <div className="emp-cell">
                      <img src={e.avatar ?? undefined} alt={e.name} />
                      <div>
                        <strong>{e.name}</strong>
                        <span>{e.role}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{e.dept}</td>
                  <td style={{ fontSize: '12px' }}>
                    {e.days < 7 ? 'Week 1' : e.days < 30 ? 'Week ' + Math.ceil(e.days / 7) : e.days < 60 ? 'Month 2' : 'Month 3'}
                    <br />
                    <span style={{ fontSize: '10px', color: 'var(--text3)' }}>Day {e.days}</span>
                  </td>
                  <td className="prog-cell">
                    <em>{e.progress}%</em>
                    <div className="pw">
                      <div
                        className={`pf ${e.status === 'at-risk' ? 'risk' : e.status === 'completed' ? 'done' : ''}`}
                        style={{ width: `${e.progress}%` }}
                      />
                    </div>
                  </td>
                  <td>
                    <span className={`sbadge ${e.status === 'on-track' ? 'on' : e.status === 'at-risk' ? 'risk' : 'done'}`}>
                      {e.status === 'on-track' ? t('components.employeeTable.active') : e.status === 'at-risk' ? t('components.employeeTable.atRisk') : t('components.employeeTable.completed')}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => router.push(`/hr/employees/${e.id}`)}
                    >
                      {t('components.employeeTable.viewJourney')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
