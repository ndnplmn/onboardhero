'use client'

import { useState, useTransition, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toggleHRTask, bulkCompleteTasks, createHRTask } from './actions'

// ── Types ─────────────────────────────────────────────────────────────────

interface Employee {
  id: string
  full_name: string
  department: string
  avatar_url?: string
}

interface Journey {
  id: string
  current_week: number
  start_date: string
  employee: Employee
}

interface Task {
  id: string
  title: string
  description: string
  week: number
  status: 'pending' | 'completed' | 'overdue'
  assigned_to_role: 'new_hire' | 'manager' | 'hr'
  completed_at: string | null
  order: number
  journey: Journey
}

interface Props {
  tasks: Task[]
  journeys: { id: string; employee: { id: string; full_name: string; department: string } }[]
}

// ── Config ────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  new_hire: { label: 'New Hire', color: 'var(--cyan)',  bg: 'var(--cyan-light)',  icon: 'fa-solid fa-person' },
  manager:  { label: 'Manager',  color: 'var(--blue)',  bg: 'var(--blue-light)',  icon: 'fa-solid fa-user-tie' },
  hr:       { label: 'HR',       color: 'var(--aqua)',  bg: 'var(--aqua-light)',  icon: 'fa-solid fa-id-badge' },
}

const DEPT_COLORS: Record<string, string> = {
  Engineering: 'var(--cyan)',
  Product: 'var(--blue)',
  Sales: 'var(--green)',
  People: 'var(--aqua)',
  Design: 'var(--purple)',
  Data: 'var(--amber)',
}

function exportTasksCSV(tasks: Task[]) {
  const rows = [
    ['Employee', 'Department', 'Week', 'Task', 'Assigned To', 'Status'],
    ...tasks.map(t => [
      t.journey?.employee?.full_name || '',
      t.journey?.employee?.department || '',
      String(t.week),
      t.title,
      ROLE_CONFIG[t.assigned_to_role]?.label || t.assigned_to_role,
      t.status,
    ]),
  ]
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tasks-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Create Task Modal ─────────────────────────────────────────────────────

function CreateTaskModal({
  journeys,
  onClose,
}: {
  journeys: Props['journeys']
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError('')
    startTransition(async () => {
      const result = await createHRTask(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(onClose, 1400)
      }
    })
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(13,21,41,0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--surface)',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--r)',
            background: 'var(--blue-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className="fa-solid fa-plus" style={{ fontSize: 16, color: 'var(--blue)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
              Add Task
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              Add a task to an active onboarding journey
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)', padding: '6px 8px' }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '44px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--green-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 24, color: 'var(--green)' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Task Added!</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>The hire will see it in their journey immediately.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{
                  background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 'var(--r)', padding: '10px 14px',
                  fontSize: 13, color: 'var(--red)',
                }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }} />{error}
                </div>
              )}

              <div className="fg">
                <label>Assign to Employee</label>
                <select name="journey_id" required>
                  <option value="">Select employee</option>
                  {journeys.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.employee.full_name} — {j.employee.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fg">
                <label>Task Title</label>
                <input name="title" type="text" placeholder="e.g., Complete onboarding survey" required />
              </div>

              <div className="fg">
                <label>Description (optional)</label>
                <textarea
                  name="description"
                  placeholder="Additional context or instructions..."
                  rows={2}
                  style={{
                    resize: 'none', background: 'var(--bg)',
                    border: '1.5px solid var(--border)', borderRadius: 'var(--r)',
                    padding: '10px 14px', color: 'var(--text)',
                    fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
                    width: '100%', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="fg">
                  <label>Week</label>
                  <select name="week" defaultValue="1">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>Week {w}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label>Assigned To</label>
                  <select name="assigned_to_role" defaultValue="new_hire">
                    <option value="new_hire">New Hire</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex', gap: 10,
              background: 'var(--surface2)',
            }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isPending} style={{ flex: 2 }}>
                {isPending
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Adding...</>
                  : <><i className="fa-solid fa-plus" /> Add Task</>
                }
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

// ── Bulk Assign Modal ────────────────────────────────────────────────────

function BulkCompleteModal({
  selectedIds,
  tasks,
  onClose,
  onDone,
}: {
  selectedIds: string[]
  tasks: Task[]
  onClose: () => void
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const selected = tasks.filter(t => selectedIds.includes(t.id))

  function handleConfirm() {
    startTransition(async () => {
      await bulkCompleteTasks(selectedIds)
      setDone(true)
      setTimeout(() => { onDone(); onClose() }, 1400)
    })
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(13,21,41,0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 20,
      }}
      onClick={onClose}
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
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r)', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: 16, color: 'var(--green)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Bulk Complete</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{selectedIds.length} task{selectedIds.length !== 1 ? 's' : ''} selected</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)', padding: '6px 8px' }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {done ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 24, color: 'var(--green)' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{selectedIds.length} tasks marked complete!</div>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px 24px', maxHeight: 220, overflowY: 'auto' }}>
              {selected.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)', fontSize: 13 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.journey?.employee?.full_name} · Week {t.week}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, background: 'var(--surface2)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={isPending}
                style={{ flex: 2 }}
                onClick={handleConfirm}
              >
                {isPending
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Processing...</>
                  : <><i className="fa-solid fa-circle-check" /> Mark All Complete</>
                }
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────

export default function TaskManagerClient({ tasks, journeys }: Props) {
  const [isPending, startTransition] = useTransition()
  const [localTasks, setLocalTasks]         = useState<Task[]>(tasks)
  const [filterStatus, setFilterStatus]     = useState<'all' | 'pending' | 'completed'>('all')
  const [filterRole, setFilterRole]         = useState<'all' | 'new_hire' | 'manager' | 'hr'>('all')
  const [filterDept, setFilterDept]         = useState<string>('all')
  const [groupBy, setGroupBy]               = useState<'employee' | 'week' | 'role'>('employee')
  const [selected, setSelected]             = useState<string[]>([])
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showBulkComplete, setShowBulkComplete] = useState(false)

  // Sync if server re-renders pass new tasks
  const activeTasks = localTasks.length > 0 ? localTasks : tasks

  // Departments from data
  const departments = useMemo(() => {
    const depts = new Set<string>()
    activeTasks.forEach(t => { if (t.journey?.employee?.department) depts.add(t.journey.employee.department) })
    return Array.from(depts).sort()
  }, [activeTasks])

  // Filtered tasks
  const filtered = useMemo(() => {
    return activeTasks.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (filterRole !== 'all' && t.assigned_to_role !== filterRole) return false
      if (filterDept !== 'all' && t.journey?.employee?.department !== filterDept) return false
      return true
    })
  }, [activeTasks, filterStatus, filterRole, filterDept])

  // KPIs
  const total     = activeTasks.length
  const completed = activeTasks.filter(t => t.status === 'completed').length
  const pending   = total - completed
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0

  // Group
  const groups = useMemo(() => {
    if (groupBy === 'employee') {
      const map: Record<string, { label: string; sublabel: string; avatar?: string; color: string; tasks: Task[] }> = {}
      filtered.forEach(t => {
        const emp = t.journey?.employee
        if (!emp) return
        if (!map[emp.id]) map[emp.id] = {
          label: emp.full_name,
          sublabel: emp.department,
          avatar: emp.avatar_url,
          color: DEPT_COLORS[emp.department] || 'var(--blue)',
          tasks: [],
        }
        map[emp.id].tasks.push(t)
      })
      return Object.entries(map).map(([id, g]) => ({ id, ...g }))
    }
    if (groupBy === 'week') {
      const map: Record<number, Task[]> = {}
      filtered.forEach(t => {
        if (!map[t.week]) map[t.week] = []
        map[t.week].push(t)
      })
      return Object.keys(map).map(Number).sort((a, b) => a - b).map(week => ({
        id: String(week),
        label: `Week ${week}`,
        sublabel: `${map[week].length} task${map[week].length !== 1 ? 's' : ''}`,
        color: 'var(--blue)',
        tasks: map[week],
      }))
    }
    // role
    const map: Record<string, Task[]> = {}
    filtered.forEach(t => {
      if (!map[t.assigned_to_role]) map[t.assigned_to_role] = []
      map[t.assigned_to_role].push(t)
    })
    return Object.entries(map).map(([role, tasks]) => ({
      id: role,
      label: ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]?.label || role,
      sublabel: `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
      color: ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]?.color || 'var(--blue)',
      tasks,
    }))
  }, [filtered, groupBy])

  function handleToggle(taskId: string, currentStatus: string) {
    const completed = currentStatus !== 'completed'
    // Optimistic update
    setLocalTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, status: completed ? 'completed' : 'pending', completed_at: completed ? new Date().toISOString() : null }
        : t
    ))
    startTransition(() => { toggleHRTask(taskId, completed) })
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function selectAllPending() {
    const pendingIds = filtered.filter(t => t.status === 'pending').map(t => t.id)
    setSelected(pendingIds)
  }

  return (
    <>
      {/* Header */}
      <header className="db-header">
        <div className="db-header-left">
          <h1>Task Manager</h1>
          <p>Monitor and manage all onboarding tasks across the organization.</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => exportTasksCSV(filtered)}>
            <i className="fa-solid fa-download" /> Export
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowCreateTask(true)}>
            <i className="fa-solid fa-plus" /> Add Task
          </button>
          {selected.length > 0 && (
            <button className="btn btn-primary btn-sm btn-glow" onClick={() => setShowBulkComplete(true)}>
              <i className="fa-solid fa-circle-check" /> Complete Selected ({selected.length})
            </button>
          )}
          {selected.length === 0 && (
            <button className="btn btn-primary btn-sm btn-glow" onClick={selectAllPending}>
              <i className="fa-solid fa-list-check" /> Bulk Select
            </button>
          )}
        </div>
      </header>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPI Row */}
        <div className="kpi-row">
          {[
            { label: 'Total Tasks',  value: total,          icon: 'fa-solid fa-list-check',       colorClass: 'cyan'  },
            { label: 'Completed',    value: completed,       icon: 'fa-solid fa-circle-check',     colorClass: 'green' },
            { label: 'Pending',      value: pending,         icon: 'fa-solid fa-clock',             colorClass: pending > 0 ? 'red' : 'blue' },
            { label: 'Completion',   value: `${completionPct}%`, icon: 'fa-solid fa-chart-pie',    colorClass: completionPct >= 75 ? 'green' : completionPct >= 40 ? 'blue' : 'red' },
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

        {/* Completion progress bar */}
        <div className="db-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>
              Overall Task Completion
            </span>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800,
              background: 'var(--grad)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {completionPct}%
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'var(--grad)', borderRadius: 100,
              width: `${completionPct}%`, transition: 'width 0.6s var(--ease)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{completed} completed</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{pending} remaining</span>
          </div>
        </div>

        {/* Filters + Group */}
        <div className="db-card" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
              Filter
            </span>

            {/* Status */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'pending', 'completed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                    border: '1px solid',
                    borderColor: filterStatus === s ? 'var(--blue)' : 'var(--border)',
                    background: filterStatus === s ? 'var(--blue-light)' : 'transparent',
                    color: filterStatus === s ? 'var(--blue)' : 'var(--text3)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

            {/* Role */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['all', 'new_hire', 'manager', 'hr'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  style={{
                    padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                    border: '1px solid',
                    borderColor: filterRole === r ? 'var(--cyan)' : 'var(--border)',
                    background: filterRole === r ? 'var(--cyan-light)' : 'transparent',
                    color: filterRole === r ? 'var(--cyan)' : 'var(--text3)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {r === 'all' ? 'All Roles' : ROLE_CONFIG[r].label}
                </button>
              ))}
            </div>

            <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

            {/* Department */}
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

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Group
              </span>
              {(['employee', 'week', 'role'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  style={{
                    padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                    border: '1px solid',
                    borderColor: groupBy === g ? 'var(--aqua)' : 'var(--border)',
                    background: groupBy === g ? 'var(--aqua-light)' : 'transparent',
                    color: groupBy === g ? 'var(--aqua)' : 'var(--text3)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected banner */}
        {selected.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            background: 'var(--grad-soft)',
            border: '1px solid var(--blue-light)',
            borderRadius: 'var(--r)',
          }}>
            <i className="fa-solid fa-check-double" style={{ color: 'var(--blue)', fontSize: 13 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', flex: 1 }}>
              {selected.length} task{selected.length !== 1 ? 's' : ''} selected
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowBulkComplete(true)}
            >
              <i className="fa-solid fa-circle-check" /> Mark Complete
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSelected([])}
              style={{ color: 'var(--text3)' }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Task groups */}
        {filtered.length === 0 ? (
          <div className="db-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: 32, color: 'var(--green)', display: 'block', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No tasks match your filters</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Try adjusting the filters above.</div>
          </div>
        ) : (
          groups.map(group => {
            const groupCompleted = group.tasks.filter(t => t.status === 'completed').length
            const groupPct = group.tasks.length > 0 ? Math.round((groupCompleted / group.tasks.length) * 100) : 0
            const groupSelected = group.tasks.filter(t => selected.includes(t.id)).length
            const allGroupSelected = groupSelected === group.tasks.filter(t => t.status === 'pending').length && groupSelected > 0

            return (
              <div key={group.id} className="db-card" style={{ overflow: 'hidden' }}>
                {/* Group header */}
                <div style={{
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  borderBottom: '1px solid var(--border)',
                }}>
                  {(group as any).avatar ? (
                    <img
                      src={(group as any).avatar}
                      alt={group.label}
                      style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--r)',
                      background: 'var(--grad-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <i className="fa-solid fa-layer-group" style={{ fontSize: 14, color: group.color }} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                        {group.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{group.sublabel}</span>
                    </div>
                    {/* Mini progress */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 100,
                          width: `${groupPct}%`,
                          background: groupPct === 100 ? 'var(--green)' : 'var(--grad)',
                          transition: 'width 0.4s var(--ease)',
                        }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: groupPct === 100 ? 'var(--green)' : 'var(--text3)', minWidth: 30, textAlign: 'right' }}>
                        {groupPct}%
                      </span>
                    </div>
                  </div>

                  {/* Select all pending in group */}
                  {group.tasks.some(t => t.status === 'pending') && (
                    <button
                      onClick={() => {
                        const pendingIds = group.tasks.filter(t => t.status === 'pending').map(t => t.id)
                        if (allGroupSelected) {
                          setSelected(prev => prev.filter(id => !pendingIds.includes(id)))
                        } else {
                          setSelected(prev => Array.from(new Set([...prev, ...pendingIds])))
                        }
                      }}
                      style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 10px',
                        borderRadius: 100,
                        border: '1px solid var(--border)',
                        background: allGroupSelected ? 'var(--grad-soft)' : 'transparent',
                        color: allGroupSelected ? 'var(--blue)' : 'var(--text3)',
                        cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                      }}
                    >
                      {allGroupSelected ? 'Deselect' : 'Select pending'}
                    </button>
                  )}
                </div>

                {/* Task rows */}
                <div>
                  {group.tasks.map((task, i) => {
                    const rc = ROLE_CONFIG[task.assigned_to_role] || ROLE_CONFIG.new_hire
                    const isDone = task.status === 'completed'
                    const isSelected = selected.includes(task.id)

                    return (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 20px',
                          borderBottom: i < group.tasks.length - 1 ? '1px solid var(--border)' : 'none',
                          background: isSelected ? 'var(--grad-soft)' : isDone ? 'transparent' : 'transparent',
                          opacity: isDone ? 0.65 : 1,
                          transition: 'background 0.15s',
                        }}
                      >
                        {/* Checkbox */}
                        {!isDone && (
                          <button
                            onClick={() => toggleSelect(task.id)}
                            style={{
                              width: 18, height: 18,
                              border: `2px solid ${isSelected ? 'var(--blue)' : 'var(--border)'}`,
                              borderRadius: 4,
                              background: isSelected ? 'var(--blue)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {isSelected && <i className="fa-solid fa-check" style={{ fontSize: 9, color: '#fff' }} />}
                          </button>
                        )}
                        {isDone && (
                          <div style={{ width: 18, height: 18, flexShrink: 0 }} />
                        )}

                        {/* Toggle */}
                        <button
                          onClick={() => handleToggle(task.id, task.status)}
                          disabled={isPending}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 16, flexShrink: 0, padding: 0,
                            color: isDone ? 'var(--green)' : 'var(--border2)',
                            transition: 'color 0.15s',
                          }}
                          title={isDone ? 'Mark as pending' : 'Mark as complete'}
                        >
                          <i className={`fa-solid ${isDone ? 'fa-circle-check' : 'fa-circle'}`} />
                        </button>

                        {/* Task info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: 'var(--text)',
                            textDecoration: isDone ? 'line-through' : 'none',
                            marginBottom: task.description ? 2 : 0,
                          }}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>
                              {task.description}
                            </div>
                          )}
                        </div>

                        {/* Week badge */}
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px',
                          borderRadius: 100,
                          background: 'var(--bg)', border: '1px solid var(--border)',
                          color: 'var(--text3)', flexShrink: 0,
                        }}>
                          W{task.week}
                        </span>

                        {/* Role badge */}
                        <span style={{
                          fontSize: 10, fontWeight: 800,
                          padding: '2px 8px', borderRadius: 100,
                          color: rc.color, background: rc.bg,
                          flexShrink: 0,
                        }}>
                          {rc.label}
                        </span>

                        {/* Status */}
                        {isDone && (
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 100,
                            color: 'var(--green)', background: 'var(--green-bg)',
                            flexShrink: 0,
                          }}>
                            Done
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateTask && (
          <CreateTaskModal
            journeys={journeys}
            onClose={() => setShowCreateTask(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBulkComplete && (
          <BulkCompleteModal
            selectedIds={selected}
            tasks={activeTasks}
            onClose={() => setShowBulkComplete(false)}
            onDone={() => {
              setLocalTasks(prev =>
                prev.map(t => selected.includes(t.id)
                  ? { ...t, status: 'completed' as const, completed_at: new Date().toISOString() }
                  : t
                )
              )
              setSelected([])
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
