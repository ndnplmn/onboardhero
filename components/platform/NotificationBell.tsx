'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/db/supabase-client'
import type { Notification, NotificationType } from '@/lib/db/types'

const TYPE_ICONS: Record<NotificationType, string> = {
  nudge:             'fa-solid fa-hand-point-right',
  risk_alert:        'fa-solid fa-triangle-exclamation',
  milestone:         'fa-solid fa-flag-checkered',
  task_due:          'fa-solid fa-clipboard-check',
  checkin_reminder:  'fa-solid fa-calendar-check',
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface CTAConfig {
  label: string
  href: string
  icon: string
}

function NotifCTA({ type, journeyId }: { type: NotificationType; journeyId?: string }) {
  const router = useRouter()

  const ctaMap: Record<string, CTAConfig> = {
    risk_alert:       { label: 'View journey',    href: journeyId ? `/manager/team/${journeyId}` : '/manager/hires', icon: 'fa-solid fa-arrow-right' },
    milestone:        { label: 'Schedule review', href: '/manager/calendar', icon: 'fa-solid fa-calendar-plus' },
    task_due:         { label: 'Open tasks',      href: '/manager/tasks',    icon: 'fa-solid fa-list-check' },
    nudge:            { label: 'View details',    href: '/manager/dashboard', icon: 'fa-solid fa-circle-info' },
    checkin_reminder: { label: 'Schedule check-in', href: '/manager/calendar', icon: 'fa-solid fa-calendar-check' },
  }

  const cta: CTAConfig = ctaMap[type] ?? ctaMap['nudge']

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
      <a
        href={cta.href}
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: 'var(--blue)', textDecoration: 'none' }}
      >
        <i className={cta.icon} style={{ fontSize: '0.65rem' }} />
        {cta.label}
      </a>
      {type === 'risk_alert' && (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(journeyId ? `/manager/calendar?schedule=${journeyId}` : '/manager/calendar') }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: '#fff', background: 'var(--red)', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-calendar-plus" style={{ fontSize: '0.65rem' }} />
          Schedule check-in
        </button>
      )}
      {type === 'checkin_reminder' && (
        <button
          onClick={(e) => { e.stopPropagation(); router.push('/manager/calendar') }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: '#fff', background: 'var(--cyan)', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-calendar-plus" style={{ fontSize: '0.65rem' }} />
          Schedule now
        </button>
      )}
    </div>
  )
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  // Fetch initial notifications
  useEffect(() => {
    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      setNotifications((data as Notification[]) || [])
    }

    fetchNotifications()
  }, [userId])

  // Subscribe to realtime INSERT and UPDATE events
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev].slice(0, 20))
          // Fire Aura whisper when manager reviewed hire's journey
          if ((newNotification as any).type === 'nudge' &&
              typeof (newNotification as any).action_url === 'string' &&
              (newNotification as any).action_url.includes('/hire/dashboard')) {
            window.dispatchEvent(new Event('aura-manager-viewed'))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? { ...n, read: updated.read } : n))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      if (!notification.read) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notification.id)

        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        )
      }

      if (notification.action_url) {
        setOpen(false)
        router.push(notification.action_url)
      }
    },
    [router, supabase]
  )

  // Group consecutive unread notifications of the same type
  const displayItems: Array<{ group: true; type: NotificationType; count: number; ids: string[]; newest: Notification } | { group: false; notification: Notification }> = (() => {
    const result: typeof displayItems = []
    let i = 0
    while (i < notifications.length) {
      const n = notifications[i]
      if (!n.read) {
        // collect consecutive unread of same type
        const sameType = [n]
        let j = i + 1
        while (j < notifications.length && !notifications[j].read && notifications[j].type === n.type) {
          sameType.push(notifications[j])
          j++
        }
        if (sameType.length > 1) {
          result.push({ group: true, type: n.type, count: sameType.length, ids: sameType.map(x => x.id), newest: n })
          i = j
          continue
        }
      }
      result.push({ group: false, notification: n })
      i++
    }
    return result
  })()

  const TYPE_GROUP_LABEL: Record<NotificationType, string> = {
    task_due:         'tasks overdue',
    risk_alert:       'risk alerts',
    milestone:        'milestone updates',
    nudge:            'messages from your manager',
    checkin_reminder: 'check-in reminders',
  }

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button className="notif-bell" onClick={() => setOpen(!open)}>
        <i className="fa-solid fa-bell"></i>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  await supabase
                    .from('notifications')
                    .update({ read: true })
                    .eq('user_id', userId)
                    .eq('read', false)
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications yet</div>
          ) : (
            displayItems.map((item, idx) => {
              if (item.group) {
                return (
                  <div
                    key={`group-${item.type}-${idx}`}
                    className="notif-item unread"
                    role="button"
                    tabIndex={0}
                    onClick={async () => {
                      await supabase.from('notifications').update({ read: true }).in('id', item.ids)
                      setNotifications(prev => prev.map(n => item.ids.includes(n.id) ? { ...n, read: true } : n))
                      setOpen(false)
                      router.push(item.newest.action_url ?? '/')
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotificationClick(item.newest) } }}
                  >
                    <div className="notif-item-icon" style={{ position: 'relative' }}>
                      <i className={TYPE_ICONS[item.type]}></i>
                      <span style={{
                        position: 'absolute', top: -4, right: -4,
                        background: 'var(--red)', color: '#fff',
                        fontSize: 9, fontWeight: 800, minWidth: 16, height: 16,
                        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{item.count}</span>
                    </div>
                    <div className="notif-item-content">
                      <strong>{item.count} {TYPE_GROUP_LABEL[item.type]}</strong>
                      <p>Tap to review all {item.count} items</p>
                      <span className="notif-time">{timeAgo(item.newest.created_at)}</span>
                      <NotifCTA type={item.type} journeyId={(item.newest as any).journey_id} />
                    </div>
                  </div>
                )
              }
              const n = item.notification
              return (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? '' : ' unread'}`}
                  onClick={() => handleNotificationClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleNotificationClick(n)
                    }
                  }}
                >
                  <div className="notif-item-icon">
                    <i className={TYPE_ICONS[n.type]}></i>
                  </div>
                  <div className="notif-item-content">
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <span className="notif-time">{timeAgo(n.created_at)}</span>
                    <NotifCTA type={n.type} journeyId={(n as any).journey_id ?? (n as any).metadata?.journey_id} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
