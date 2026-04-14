'use client'

import { useState } from 'react'

interface Notification {
  id:         string
  type:       'milestone' | 'task' | 'info' | 'checkin'
  title:      string
  message:    string
  created_at: string
  read:       boolean
}

interface PendingTask {
  id:       string
  title:    string
  due_date: string
  overdue:  boolean
}

interface UpcomingEvent {
  id:    string
  label: string
  date:  string
  color: string
}

interface HireAlertsClientProps {
  notifications:  Notification[]
  pendingTasks:   PendingTask[]
  upcomingEvents: UpcomingEvent[]
}

const NOTIF_CONFIG = {
  milestone: { color: 'var(--green)',  bg: 'var(--green-bg)',  icon: 'fa-solid fa-flag-checkered' },
  task:      { color: 'var(--amber)',  bg: 'var(--amber-bg)',  icon: 'fa-solid fa-list-check'     },
  info:      { color: 'var(--cyan)',   bg: 'var(--cyan-light)', icon: 'fa-solid fa-circle-info'   },
  checkin:   { color: 'var(--blue)',   bg: 'var(--blue-light)', icon: 'fa-solid fa-handshake'     },
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function daysFromNow(dateStr: string): number {
  const target = new Date(dateStr)
  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export default function HireAlertsClient({ notifications, pendingTasks, upcomingEvents }: HireAlertsClientProps) {
  const [readIds, setReadIds]   = useState<string[]>(notifications.filter(n => n.read).map(n => n.id))
  const [dismissed, setDismissed] = useState<string[]>([])

  const unread = notifications.filter(n => !readIds.includes(n.id)).length

  function markAllRead() {
    setReadIds(notifications.map(n => n.id))
  }

  function dismiss(id: string) {
    setDismissed(prev => [...prev, id])
    setReadIds(prev => [...prev, id])
  }

  const visible = notifications.filter(n => !dismissed.includes(n.id))

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i
              className="fa-solid fa-bell"
              style={{ marginRight: 8, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              aria-hidden="true"
            />
            My Alerts
          </h1>
          <p>Stay on top of tasks, check-ins, and milestones in your onboarding journey.</p>
        </div>
        {unread > 0 && (
          <div className="db-header-actions">
            <button className="btn btn-outline btn-sm" onClick={markAllRead} aria-label="Mark all notifications as read">
              <i className="fa-solid fa-check-double" aria-hidden="true" /> Mark All Read
            </button>
          </div>
        )}
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPI strip */}
        <div className="db-grid-kpi3">
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-bell" aria-hidden="true" /></div>
            <div className="kpi-value">{unread}</div>
            <div className="kpi-label">Unread</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon amber"><i className="fa-solid fa-list-check" aria-hidden="true" /></div>
            <div className="kpi-value">{pendingTasks.length}</div>
            <div className="kpi-label">Tasks Pending</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-calendar-check" aria-hidden="true" /></div>
            <div className="kpi-value">{upcomingEvents.length}</div>
            <div className="kpi-label">Upcoming Events</div>
          </div>
        </div>

        {/* Main + Side */}
        <div className="db-grid-2-1" style={{ alignItems: 'start' }}>

          {/* Notifications feed */}
          <div className="db-card">
            <div className="db-card-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="fa-solid fa-bell" style={{ color: 'var(--blue)' }} aria-hidden="true" />
                <h3>Notifications</h3>
                {unread > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: 'var(--blue)', color: '#fff' }}>
                    {unread}
                  </span>
                )}
              </div>
            </div>
            <div style={{ padding: '0 4px 4px' }}>
              {visible.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)' }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 28, display: 'block', marginBottom: 10, color: 'var(--green)' }} aria-hidden="true" />
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>All caught up!</p>
                  <p style={{ fontSize: 12 }}>No pending notifications.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {visible.map((n, i) => {
                    const cfg     = NOTIF_CONFIG[n.type] ?? NOTIF_CONFIG.info
                    const isRead  = readIds.includes(n.id)
                    return (
                      <div
                        key={n.id}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 14,
                          padding: '16px 20px',
                          borderBottom: i < visible.length - 1 ? '1px solid var(--border)' : 'none',
                          background: isRead ? 'transparent' : 'var(--surface)',
                          transition: 'background 0.15s',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 'var(--r)', flexShrink: 0,
                          background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className={cfg.icon} style={{ color: cfg.color, fontSize: 14 }} aria-hidden="true" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                            <strong style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                              {!isRead && (
                                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', marginRight: 6, verticalAlign: 'middle' }} />
                              )}
                              {n.title}
                            </strong>
                            <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, margin: 0 }}>{n.message}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => dismiss(n.id)}
                          aria-label="Dismiss notification"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, padding: 4, flexShrink: 0, borderRadius: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
                        >
                          <i className="fa-solid fa-xmark" aria-hidden="true" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

            {/* Pending tasks */}
            <div className="db-card" style={{ padding: '24px' }}>
              <div className="db-card-hd" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-list-check" style={{ color: 'var(--amber)' }} aria-hidden="true" />
                  <h3>Pending Tasks</h3>
                </div>
              </div>
              {pendingTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text3)', fontSize: 12 }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 18, display: 'block', marginBottom: 6, color: 'var(--green)' }} aria-hidden="true" />
                  No pending tasks!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingTasks.map(t => (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 'var(--r)',
                        background: t.overdue ? 'var(--red-bg)' : 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderLeft: `3px solid ${t.overdue ? 'var(--red)' : 'var(--amber)'}`,
                      }}
                    >
                      <i
                        className={`fa-solid ${t.overdue ? 'fa-triangle-exclamation' : 'fa-circle-dot'}`}
                        style={{ color: t.overdue ? 'var(--red)' : 'var(--amber)', fontSize: 12, flexShrink: 0 }}
                        aria-hidden="true"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: t.overdue ? 'var(--red)' : 'var(--text3)', fontWeight: t.overdue ? 700 : 400 }}>
                          {t.overdue ? `Overdue · ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : `Due ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming events */}
            <div className="db-card" style={{ padding: '24px' }}>
              <div className="db-card-hd" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-calendar-days" style={{ color: 'var(--cyan)' }} aria-hidden="true" />
                  <h3>Upcoming Events</h3>
                </div>
              </div>
              {upcomingEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text3)', fontSize: 12 }}>No upcoming events.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {upcomingEvents.map(ev => {
                    const diff = daysFromNow(ev.date)
                    return (
                      <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 'var(--r)', flexShrink: 0,
                          background: `${ev.color}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <i className="fa-solid fa-calendar-check" style={{ color: ev.color, fontSize: 12 }} aria-hidden="true" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 1 }}>{ev.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                            {diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff < 0 ? `${Math.abs(diff)}d ago` : `In ${diff}d`} · {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
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
