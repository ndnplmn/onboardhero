'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/db/supabase-client'
import type { Profile } from '@/lib/db/types'
import Link from 'next/link'

const NAV_ITEMS = {
  hr: [
    { icon: 'fa-solid fa-gauge-high', label: 'Dashboard', href: '/hr/dashboard' },
    { icon: 'fa-solid fa-route', label: 'Journeys', href: '/hr/journeys' },
    { icon: 'fa-solid fa-users', label: 'Employees', href: '/hr/employees' },
    { icon: 'fa-solid fa-chart-bar', label: 'Analytics', href: '/hr/analytics' },
    { icon: 'fa-solid fa-file-circle-check', label: 'Forms', href: '/hr/forms' },
    { icon: 'fa-solid fa-file-lines', label: 'Content Studio', href: '/hr/content' },
  ],
  manager: [
    { icon: 'fa-solid fa-gauge-high', label: 'Dashboard', href: '/manager/dashboard' },
    { icon: 'fa-solid fa-comments', label: 'AI Coach', href: '/manager/coaching' },
  ],
  new_hire: [
    { icon: 'fa-solid fa-gauge-high', label: 'My Journey', href: '/hire/dashboard' },
    { icon: 'fa-solid fa-list-check', label: 'Tasks', href: '/hire/tasks' },
    { icon: 'fa-solid fa-book', label: 'Resources', href: '/hire/resources' },
    { icon: 'fa-solid fa-file-pen', label: 'Forms', href: '/hire/forms' },
    { icon: 'fa-solid fa-user', label: 'Profile', href: '/hire/profile' },
    { icon: 'fa-solid fa-robot', label: 'AI Assistant', href: '/hire/chat' },
  ],
}

interface SidebarProps {
  user: Profile
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseBrowser()
  const items = NAV_ITEMS[user.role] || []

  const roleLabel: Record<string, string> = {
    hr: 'HR Manager',
    manager: 'Team Manager',
    new_hire: 'New Hire',
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="app-sidebar">
      <div className="sb-logo">
        <img src="/ONBOARD_HERO_LOGO.png" alt="OnboardHero" className="sb-logo-img" />
      </div>
      <div className="sb-role-switcher">
        <label>View Mode</label>
        <select
          value={pathname.startsWith('/hr') ? 'hr' : pathname.startsWith('/manager') ? 'manager' : 'new_hire'}
          onChange={(e) => {
            const role = e.target.value
            if (role === 'hr') router.push('/hr/dashboard')
            else if (role === 'manager') router.push('/manager/dashboard')
            else router.push('/hire/dashboard')
          }}
        >
          <option value="hr">HR Manager</option>
          <option value="manager">Team Manager</option>
          <option value="new_hire">New Hire</option>
        </select>
      </div>

      <nav className="sb-nav">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sb-nav-item${pathname === item.href ? ' active' : ''}`}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sb-user">
        <img src={user.avatar_url || `https://i.pravatar.cc/34?u=${user.id}`} alt="user" />
        <div>
          <strong>{user.full_name}</strong>
          <span>{roleLabel[user.role]}</span>
        </div>
        <button className="sb-logout" onClick={handleLogout} title="Log out">
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </aside>
  )
}
