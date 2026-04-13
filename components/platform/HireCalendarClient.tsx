'use client'

import { useState, useMemo } from 'react'

interface Milestone {
  label:   string
  dateStr: string
  days:    number
  done:    boolean
}

interface CheckIn {
  id:             string
  scheduled_date: string
  completed_date: string | null
  type:           string
  managerName:    string
}

interface Task {
  id:       string
  title:    string
  due_date: string
  done:     boolean
}

interface HireCalendarClientProps {
  milestones: Milestone[]
  checkIns:   CheckIn[]
  tasks:      Task[]
  startDate:  string
}

const DAY_NAMES  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TYPE_LABELS: Record<string, string> = {
  weekly:   'Weekly 1:1',
  day30:    '30-Day Review',
  day60:    '60-Day Review',
  day90:    '90-Day Sign-off',
  'ad-hoc': 'Ad-hoc',
}

const TYPE_COLORS: Record<string, string> = {
  weekly:   'var(--blue)',
  day30:    'var(--cyan)',
  day60:    'var(--aqua)',
  day90:    'var(--green)',
  'ad-hoc': 'var(--amber)',
}

function daysFromNow(dateStr: string): number {
  const target = new Date(dateStr)
  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function formatRelative(dateStr: string): string {
  const diff = daysFromNow(dateStr)
  if (diff === 0)  return 'Today'
  if (diff === 1)  return 'Tomorrow'
  if (diff < 0)   return `${Math.abs(diff)}d ago`
  return `In ${diff}d`
}

export default function HireCalendarClient({ milestones, checkIns, tasks, startDate }: HireCalendarClientProps) {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())

  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const monthLabel    = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }

  // Map check-ins & tasks to calendar day numbers
  const eventsByDay = useMemo(() => {
    const map: Record<number, Array<{ label: string; color: string }>> = {}
    const add = (dateStr: string, label: string, color: string) => {
      const d = new Date(dateStr)
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push({ label, color })
      }
    }
    checkIns.forEach(c => add(c.scheduled_date, TYPE_LABELS[c.type] ?? c.type, TYPE_COLORS[c.type] ?? 'var(--blue)'))
    milestones.forEach(m => add(m.dateStr, m.label, m.done ? 'var(--green)' : 'var(--amber)'))
    tasks.filter(t => !t.done && t.due_date).forEach(t => add(t.due_date, t.title, 'var(--violet)'))
    return map
  }, [checkIns, milestones, tasks, viewYear, viewMonth])

  // Events for selected day
  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : []

  // Journey progress
  const start = new Date(startDate)
  const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / 86400000)

  // Upcoming check-ins (next 3)
  const upcomingCI = checkIns
    .filter(c => !c.completed_date && daysFromNow(c.scheduled_date) >= 0)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
    .slice(0, 3)

  // Upcoming tasks
  const upcomingTasks = tasks
    .filter(t => !t.done && t.due_date)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 4)

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i
              className="fa-solid fa-calendar-days"
              style={{ marginRight: 8, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              aria-hidden="true"
            />
            My Schedule
          </h1>
          <p>Your upcoming check-ins, milestones, and task deadlines in one place.</p>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-calendar-check" aria-hidden="true" /></div>
            <div className="kpi-value">{daysSinceStart}</div>
            <div className="kpi-label">Days In</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-handshake" aria-hidden="true" /></div>
            <div className="kpi-value">{checkIns.filter(c => !c.completed_date).length}</div>
            <div className="kpi-label">Upcoming Check-ins</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon amber"><i className="fa-solid fa-list-check" aria-hidden="true" /></div>
            <div className="kpi-value">{tasks.filter(t => !t.done).length}</div>
            <div className="kpi-label">Open Tasks</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-flag-checkered" aria-hidden="true" /></div>
            <div className="kpi-value">{milestones.filter(m => !m.done).length}</div>
            <div className="kpi-label">Milestones Ahead</div>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-standard)', alignItems: 'start' }}>

          {/* Calendar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
            <div className="db-card" style={{ padding: '24px' }}>
              {/* Month nav */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)' }}>{monthLabel}</h3>
                <div style={{ display: 'flex', gap: 4 }}>
                  {!isCurrentMonth && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, color: 'var(--blue)' }}
                      onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelectedDay(today.getDate()) }}
                    >
                      Today
                    </button>
                  )}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={prevMonth} aria-label="Previous month">
                    <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={nextMonth} aria-label="Next month">
                    <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
                {DAY_NAMES.map(d => (
                  <div key={d} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textAlign: 'center', paddingBottom: 6 }}>{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const events     = eventsByDay[day] ?? []
                  const isToday    = isCurrentMonth && day === today.getDate()
                  const isSelected = day === selectedDay
                  const hasEvents  = events.length > 0

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                      aria-label={`${day} ${monthLabel}${hasEvents ? `, ${events.length} event${events.length > 1 ? 's' : ''}` : ''}`}
                      style={{
                        aspectRatio: '1 / 1',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        borderRadius: 'var(--r)',
                        border: isSelected ? '2px solid var(--blue)' : isToday ? '1.5px solid var(--cyan)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--blue-light)' : isToday ? 'var(--surface)' : 'transparent',
                        fontSize: 13, fontWeight: isToday || isSelected ? 800 : 500,
                        color: isSelected ? 'var(--blue)' : isToday ? 'var(--cyan)' : 'var(--text)',
                        cursor: 'pointer', gap: 2,
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {day}
                      {hasEvents && (
                        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {events.slice(0, 3).map((e, i) => (
                            <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: e.color }} />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 14, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                {[
                  { label: 'Check-in', color: 'var(--blue)' },
                  { label: 'Milestone', color: 'var(--amber)' },
                  { label: 'Task Due',  color: 'var(--violet)' },
                  { label: 'Completed', color: 'var(--green)' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Selected day details */}
            {selectedDay !== null && (
              <div className="db-card" style={{ padding: '20px 24px' }}>
                <div className="db-card-hd" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fa-solid fa-calendar-day" style={{ color: 'var(--blue)' }} aria-hidden="true" />
                    <h3>
                      {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    {selectedEvents.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--blue-light)', color: 'var(--blue)' }}>
                        {selectedEvents.length}
                      </span>
                    )}
                  </div>
                </div>
                {selectedEvents.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    <i className="fa-solid fa-calendar-xmark" style={{ fontSize: 22, display: 'block', marginBottom: 8, color: 'var(--border)' }} aria-hidden="true" />
                    Nothing scheduled this day.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedEvents.map((evt, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '12px 14px', borderRadius: 'var(--r)',
                          border: '1px solid var(--border)',
                          borderLeft: `3px solid ${evt.color}`,
                          background: 'var(--surface)',
                        }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: evt.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{evt.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

            {/* Journey milestones */}
            <div className="db-card" style={{ padding: '24px' }}>
              <div className="db-card-hd" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-route" style={{ color: 'var(--blue)' }} aria-hidden="true" />
                  <h3>Journey Milestones</h3>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {milestones.map((m, i) => {
                  const diff   = daysFromNow(m.dateStr)
                  const urgent = !m.done && diff <= 7 && diff >= 0
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 'var(--r)',
                        background: m.done ? 'var(--green-bg)' : urgent ? 'var(--amber-bg)' : 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderLeft: `3px solid ${m.done ? 'var(--green)' : urgent ? 'var(--amber)' : 'var(--blue)'}`,
                      }}
                    >
                      <i
                        className={`fa-solid ${m.done ? 'fa-circle-check' : 'fa-circle'}`}
                        style={{ color: m.done ? 'var(--green)' : urgent ? 'var(--amber)' : 'var(--text3)', fontSize: 14, flexShrink: 0 }}
                        aria-hidden="true"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: m.done ? 'var(--green)' : urgent ? 'var(--amber)' : 'var(--text3)' }}>
                          {m.done ? 'Completed' : formatRelative(m.dateStr)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Next check-ins */}
            <div className="db-card" style={{ padding: '24px' }}>
              <div className="db-card-hd" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-handshake" style={{ color: 'var(--cyan)' }} aria-hidden="true" />
                  <h3>Upcoming Check-ins</h3>
                </div>
              </div>
              {upcomingCI.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text3)', fontSize: 12 }}>
                  No upcoming check-ins.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {upcomingCI.map(ci => (
                    <div key={ci.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 4, borderRadius: 2, alignSelf: 'stretch', background: TYPE_COLORS[ci.type] ?? 'var(--blue)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 1 }}>
                          {TYPE_LABELS[ci.type] ?? ci.type}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {formatRelative(ci.scheduled_date)} · {ci.managerName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks due soon */}
            <div className="db-card" style={{ padding: '24px' }}>
              <div className="db-card-hd" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-list-check" style={{ color: 'var(--violet)' }} aria-hidden="true" />
                  <h3>Tasks Due Soon</h3>
                </div>
              </div>
              {upcomingTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text3)', fontSize: 12 }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 18, display: 'block', marginBottom: 6, color: 'var(--green)' }} aria-hidden="true" />
                  All caught up!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {upcomingTasks.map(t => {
                    const diff   = daysFromNow(t.due_date)
                    const overdue = diff < 0
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 'var(--r)', flexShrink: 0,
                          background: overdue ? 'var(--red-bg)' : 'var(--surface)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i
                            className="fa-solid fa-circle"
                            style={{ fontSize: 8, color: overdue ? 'var(--red)' : 'var(--violet)' }}
                            aria-hidden="true"
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                          <div style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text3)', fontWeight: overdue ? 700 : 400 }}>
                            {overdue ? `Overdue ${Math.abs(diff)}d` : formatRelative(t.due_date)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
