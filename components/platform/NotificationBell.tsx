'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/db/supabase-client'
import type { Notification } from '@/lib/db/types'

const TYPE_ICONS: Record<Notification['type'], string> = {
  nudge: 'fa-solid fa-hand-point-right',
  risk_alert: 'fa-solid fa-triangle-exclamation',
  milestone: 'fa-solid fa-flag-checkered',
  task_due: 'fa-solid fa-clipboard-check',
  checkin_reminder: 'fa-solid fa-calendar-check',
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

  // Subscribe to realtime INSERT events
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

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button className="notif-bell" onClick={() => setOpen(!open)}>
        <i className="fa-solid fa-bell"></i>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <strong>Notifications</strong>
          </div>
          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications yet</div>
          ) : (
            notifications.map((n) => (
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
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
