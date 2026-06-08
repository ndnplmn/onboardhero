'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Alert {
  id: string
  type: 'warning' | 'info'
  title: string
  description: string
  action?: { label: string; href?: string; onClick?: string }
}

interface ActiveAlertsProps {
  alerts?: Alert[]
  onScheduleCheckIn?: () => void
  onInviteNew?: () => void
}

const SNOOZE_MS = 60 * 60 * 1000 // 1 hour

export default function ActiveAlerts({ alerts: propAlerts, onScheduleCheckIn, onInviteNew }: ActiveAlertsProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState<string[]>([])
  const [snoozed, setSnoozed]     = useState<string[]>([])

  useEffect(() => {
    try {
      const now = Date.now()
      const raw = JSON.parse(localStorage.getItem('alerts_snoozed') ?? '{}') as Record<string, number>
      const active = Object.entries(raw).filter(([, until]) => until > now).map(([id]) => id)
      setSnoozed(active)
    } catch {}
  }, [])

  function snooze(id: string) {
    const until = Date.now() + SNOOZE_MS
    try {
      const raw = JSON.parse(localStorage.getItem('alerts_snoozed') ?? '{}') as Record<string, number>
      raw[id] = until
      localStorage.setItem('alerts_snoozed', JSON.stringify(raw))
    } catch {}
    setSnoozed(s => [...s, id])
  }

  const alerts  = propAlerts ?? []
  const visible = alerts.filter((a: Alert) => !dismissed.includes(a.id) && !snoozed.includes(a.id))

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {visible.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '2px 8px',
              borderRadius: 100, background: 'var(--red-bg)', color: 'var(--red)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              {visible.length}
            </span>
          )}
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, color: 'var(--blue)', padding: '3px 8px' }}
            onClick={() => router.push('/hr/alerts')}
          >
            View all <i className="fa-solid fa-arrow-right" style={{ fontSize: 9 }} />
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 13 }}>
          <i className="fa-solid fa-shield-check" style={{ fontSize: 22, color: 'var(--green)', display: 'block', marginBottom: 8 }} />
          All clear — no active alerts.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visible.map((alert: Alert) => (
            <div
              key={alert.id}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--r)',
                border: `1px solid ${alert.type === 'warning' ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                background: alert.type === 'warning' ? 'var(--red-bg)' : 'var(--bg)',
                borderLeft: `3px solid ${alert.type === 'warning' ? 'var(--red)' : 'var(--blue)'}`,
              }}
            >
              <div style={{ display: 'flex', gap: 10, marginBottom: alert.action ? 8 : 0 }}>
                <i
                  className={`fa-solid ${alert.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}`}
                  style={{ color: alert.type === 'warning' ? 'var(--red)' : 'var(--blue)', marginTop: 2, flexShrink: 0, fontSize: 12 }}
                />
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text)', marginBottom: 2 }}>
                    {alert.title}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: '1.5' }}>
                    {alert.description}
                  </span>
                </div>
                {/* Snooze (1h) */}
                <button
                  onClick={() => snooze(alert.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2, flexShrink: 0 }}
                  title="Snooze 1 hour"
                  aria-label="Snooze alert for 1 hour"
                >
                  <i className="fa-solid fa-clock" style={{ fontSize: 10 }} />
                </button>
                {/* Dismiss */}
                <button
                  onClick={() => setDismissed(d => [...d, alert.id])}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2, flexShrink: 0 }}
                  title="Dismiss"
                  aria-label="Dismiss alert"
                >
                  <i className="fa-solid fa-xmark" style={{ fontSize: 10 }} />
                </button>
              </div>
              {alert.action && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: 10, padding: '3px 10px', marginLeft: 22 }}
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
