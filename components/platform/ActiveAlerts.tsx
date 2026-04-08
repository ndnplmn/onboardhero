'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Alert {
  id: string
  type: 'warning' | 'info'
  title: string
  description: string
  action?: { label: string; href?: string; onClick?: string }
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Priya Mehta — At Risk',
    description: '3 overdue tasks in Week 7. Manager check-in not completed. Journey stalled for 9 days.',
    action: { label: 'Schedule Check-in', onClick: 'schedule' },
  },
  {
    id: '2',
    type: 'info',
    title: 'Sarah Kim — 30-day review due',
    description: 'First month review scheduled for March 18. Action required from manager.',
    action: { label: 'View Profile', href: '/hr/employees/3' },
  },
  {
    id: '3',
    type: 'info',
    title: '2 new hires starting next week',
    description: 'Jordan Blake (Product) and Wei Li (Data Science) — journeys not yet assigned.',
    action: { label: 'Assign Journeys', onClick: 'invite' },
  },
]

interface ActiveAlertsProps {
  onScheduleCheckIn?: () => void
  onInviteNew?: () => void
}

export default function ActiveAlerts({ onScheduleCheckIn, onInviteNew }: ActiveAlertsProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState<string[]>([])

  const visible = MOCK_ALERTS.filter(a => !dismissed.includes(a.id))

  function handleAction(alert: Alert) {
    if (!alert.action) return
    if (alert.action.onClick === 'schedule') onScheduleCheckIn?.()
    else if (alert.action.onClick === 'invite') onInviteNew?.()
    else if (alert.action.href) router.push(alert.action.href)
  }

  return (
    <div className="pro-max-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-bell" style={{ color: 'var(--amber)' }} />
          <h3>Active Alerts</h3>
        </div>
        {visible.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
            {visible.length} pending
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 13 }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: 20, color: 'var(--green)', display: 'block', marginBottom: 8 }} />
          All clear — no active alerts.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visible.map(alert => (
            <div
              key={alert.id}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r)',
                border: `1px solid ${alert.type === 'warning' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                background: alert.type === 'warning' ? 'var(--red-bg)' : 'var(--bg)',
                borderLeft: `3px solid ${alert.type === 'warning' ? 'var(--red)' : 'var(--blue)'}`,
              }}
            >
              <div style={{ display: 'flex', gap: 10, marginBottom: alert.action ? 10 : 0 }}>
                <i
                  className={`fa-solid ${alert.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}`}
                  style={{ color: alert.type === 'warning' ? 'var(--red)' : 'var(--blue)', marginTop: 2, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text)', marginBottom: 3 }}>
                    {alert.title}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: '1.5' }}>
                    {alert.description}
                  </span>
                </div>
                <button
                  onClick={() => setDismissed(d => [...d, alert.id])}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2, flexShrink: 0 }}
                  title="Dismiss"
                >
                  <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} />
                </button>
              </div>
              {alert.action && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: 11, padding: '4px 12px', marginLeft: 24 }}
                  onClick={() => handleAction(alert)}
                >
                  {alert.action.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
