'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/db/supabase-client'
import type { Notification } from '@/lib/db/types'

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifications(data as Notification[] || []))
  }, [userId])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div className="notif-wrapper">
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
                onClick={() => markAsRead(n.id)}
              >
                <strong>{n.title}</strong>
                <p>{n.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
