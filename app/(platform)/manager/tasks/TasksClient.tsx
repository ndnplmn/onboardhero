'use client'

import { useState, useTransition, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toggleManagerTask } from '@/app/(platform)/manager/actions'

interface Task {
  id: string
  journey_id: string
  title: string
  description: string
  week: number
  status: string
  assigned_to_role: string
  due_date: string | null
  completed_at: string | null
  employee: {
    id: string
    full_name: string
    department: string
    avatar_url: string | null
  } | null
}

interface Kpis {
  total:     number
  completed: number
  pending:   number
  pct:       number
}

interface BreakdownEntry {
  name:  string
  pct:   number
  done:  number
  total: number
}

interface TasksClientProps {
  tasks:     Task[]
  kpis:      Kpis
  breakdown: BreakdownEntry[]
}

type Filter = 'all' | 'pending' | 'completed'

export default function TasksClient({ tasks, kpis, breakdown }: TasksClientProps) {
  const [filter,     setFilter]     = useState<Filter>('all')
  const [search,     setSearch]     = useState('')
  const [optimistic, setOptimistic] = useState<Record<string, string>>({})
  const [isPending,  startTransition] = useTransition()

  function handleToggle(task: Task) {
    const currentStatus = optimistic[task.id] ?? task.status
    const nextStatus    = currentStatus === 'completed' ? 'pending' : 'completed'
    setOptimistic(prev => ({ ...prev, [task.id]: nextStatus }))
    startTransition(async () => {
      await toggleManagerTask(task.id, nextStatus === 'completed')
    })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return tasks.filter(t => {
      const status = optimistic[t.id] ?? t.status
      const matchesFilter =
        filter === 'all' ||
        (filter === 'pending'   && status !== 'completed') ||
        (filter === 'completed' && status === 'completed')
      const matchesSearch = !q ||
        t.title.toLowerCase().includes(q) ||
        (t.employee?.full_name ?? '').toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [tasks, filter, search, optimistic])

  // Group by week
  const weeks = Array.from(new Set(filtered.map(t => t.week))).sort((a, b) => a - b)

  // Live KPI override based on optimistic state
  const liveCompleted = tasks.filter(t => (optimistic[t.id] ?? t.status) === 'completed').length
  const livePct       = tasks.length > 0 ? Math.round((liveCompleted / tasks.length) * 100) : 0
  const livePending   = tasks.length - liveCompleted

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>My Tasks</h1>
          <p>Track and manage your onboarding-related actions and follow-ups.</p>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPIs */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-list-check" /></div>
            <div className="kpi-value">{kpis.total}</div>
            <div className="kpi-label">Total Tasks</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon amber"><i className="fa-solid fa-clock" /></div>
            <div className="kpi-value">{livePending}</div>
            <div className="kpi-label">Pending</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-circle-check" /></div>
            <div className="kpi-value">{liveCompleted}</div>
            <div className="kpi-label">Completed</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-chart-pie" /></div>
            <div className="kpi-value">{livePct}%</div>
            <div className="kpi-label">Completion Rate</div>
          </div>
        </div>

        {/* Main 2/3 + Side 1/3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-standard)', alignItems: 'start' }}>

          {/* Task list */}
          <div className="db-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header + controls */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <i className="fa-solid fa-list-check" style={{ color: 'var(--blue)' }} />
                <h3>Active Actions</h3>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--blue-light)', color: 'var(--blue)' }}>
                  {filtered.length}
                </span>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text3)' }} />
                <input
                  type="text"
                  placeholder="Search tasks…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    paddingLeft: 30, paddingRight: 12, height: 32, fontSize: 12,
                    background: 'var(--bg)', border: '1.5px solid var(--border)',
                    borderRadius: 'var(--r)', color: 'var(--text)', outline: 'none', width: 180,
                  }}
                />
              </div>

              {/* Filter pills */}
              <div style={{ display: 'flex', gap: 6 }}>
                {(['all', 'pending', 'completed'] as Filter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      fontSize: 11, padding: '4px 12px', borderRadius: 'var(--r)',
                      background: filter === f ? 'var(--blue)' : 'var(--surface)',
                      color:      filter === f ? '#fff'        : 'var(--text2)',
                      border:     filter === f ? 'none'        : '1px solid var(--border)',
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks grouped by week */}
            <div style={{ padding: '8px 0' }}>
              {weeks.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 28, color: 'var(--green)', display: 'block', marginBottom: 10 }} />
                  No tasks match your filter.
                </div>
              ) : (
                weeks.map(week => {
                  const weekTasks = filtered.filter(t => t.week === week)
                  return (
                    <div key={week} style={{ marginBottom: 4 }}>
                      {/* Week label */}
                      <div style={{
                        padding: '8px 24px',
                        fontSize: 10, fontWeight: 800, color: 'var(--text3)',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        background: 'var(--surface)',
                        borderTop: '1px solid var(--border)',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        Week {week}
                      </div>

                      <AnimatePresence mode="sync">
                        {weekTasks.map((task, i) => {
                          const status = optimistic[task.id] ?? task.status
                          const isDone = status === 'completed'
                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ delay: i * 0.03 }}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: 14,
                                padding: '14px 24px',
                                borderBottom: '1px solid var(--border)',
                                opacity: isDone ? 0.55 : 1,
                                transition: 'opacity 0.2s',
                              }}
                            >
                              {/* Toggle button */}
                              <button
                                onClick={() => handleToggle(task)}
                                disabled={isPending}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  fontSize: 18, flexShrink: 0, marginTop: 2,
                                  color: isDone ? 'var(--green)' : 'var(--border)',
                                  transition: 'color 0.15s',
                                }}
                                title={isDone ? 'Mark as pending' : 'Mark as complete'}
                              >
                                <i className={`fa-solid ${isDone ? 'fa-circle-check' : 'fa-circle'}`} />
                              </button>

                              {/* Content */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                  <strong style={{
                                    fontSize: 13, color: 'var(--text)',
                                    textDecoration: isDone ? 'line-through' : 'none',
                                  }}>
                                    {task.title}
                                  </strong>
                                  {isDone && (
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 100, background: 'var(--green-bg)', color: 'var(--green)' }}>
                                      Done
                                    </span>
                                  )}
                                </div>
                                {task.description && (
                                  <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0, lineHeight: 1.5 }}>
                                    {task.description}
                                  </p>
                                )}
                              </div>

                              {/* Employee tag */}
                              {task.employee && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                  {task.employee.avatar_url ? (
                                    <img
                                      src={task.employee.avatar_url}
                                      alt={task.employee.full_name}
                                      style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--border)' }}
                                    />
                                  ) : (
                                    <div style={{
                                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                      background: 'var(--blue-light)', display: 'flex',
                                      alignItems: 'center', justifyContent: 'center',
                                      fontSize: 9, fontWeight: 800, color: 'var(--blue)',
                                    }}>
                                      {task.employee.full_name.charAt(0)}
                                    </div>
                                  )}
                                  <span style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {task.employee.full_name.split(' ')[0]}
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Side column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

            {/* Task Analytics */}
            <div className="db-card" style={{ padding: '24px' }}>
              <div className="db-card-hd" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-chart-pie" style={{ color: 'var(--cyan)' }} />
                  <h3>Task Analytics</h3>
                </div>
              </div>

              {/* Overall progress bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
                  <span>Overall Completion</span>
                  <span style={{ color: 'var(--cyan)' }}>{livePct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${livePct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'var(--grad)', borderRadius: 100 }}
                  />
                </div>
              </div>

              {/* Per-employee breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {breakdown.map(e => (
                  <div key={e.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>
                      <span>{e.name.split(' ')[0]}</span>
                      <span style={{ color: e.pct >= 80 ? 'var(--green)' : e.pct >= 50 ? 'var(--blue)' : 'var(--amber)' }}>
                        {e.done}/{e.total}
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${e.pct}%`, borderRadius: 100,
                        background: e.pct >= 80 ? 'var(--green)' : e.pct >= 50 ? 'var(--blue)' : 'var(--amber)',
                        transition: 'width 0.5s ease-out',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recently Completed */}
            <div className="db-card" style={{ padding: '24px' }}>
              <div className="db-card-hd" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--blue)' }} />
                  <h3>Recently Completed</h3>
                </div>
              </div>

              {(() => {
                const recentlyDone = tasks
                  .filter(t => (optimistic[t.id] ?? t.status) === 'completed')
                  .slice(0, 5)
                if (recentlyDone.length === 0) return (
                  <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>
                    No completed tasks yet.
                  </p>
                )
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recentlyDone.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)', marginTop: 2, flexShrink: 0, fontSize: 12 }} />
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{t.title}</span>
                          {t.employee && (
                            <span style={{ display: 'block', fontSize: 10, color: 'var(--text3)' }}>
                              {t.employee.full_name} · Week {t.week}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
