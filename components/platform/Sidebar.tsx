'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/db/supabase-client'
import type { Profile } from '@/lib/db/types'
import Link from 'next/link'

const NAV_SCHEMA = {
  hr: [
    { section: 'Main', items: [
      { icon: 'fa-solid fa-gauge-high', label: 'Dashboard', href: '/hr/dashboard' },
      { icon: 'fa-solid fa-users', label: 'All Employees', href: '/hr/employees' },
      { icon: 'fa-solid fa-route', label: 'Journey Builder', href: '/hr/journeys' },
      { icon: 'fa-solid fa-list-check', label: 'Task Manager', href: '/hr/tasks' },
    ]},
    { section: 'Analytics', items: [
      { icon: 'fa-solid fa-chart-bar', label: 'Reports', href: '/hr/analytics' },
      { icon: 'fa-solid fa-bell', label: 'Alerts', href: '/hr/alerts' },
    ]},
    { section: 'Settings', items: [
      { icon: 'fa-solid fa-gear', label: 'Settings', href: '/hr/settings' },
    ]},
  ],
  manager: [
    { section: 'Overview', items: [
      { icon: 'fa-solid fa-gauge-high', label: 'Dashboard', href: '/manager/dashboard' },
      { icon: 'fa-solid fa-person', label: 'My New Hires', href: '/manager/hires' },
      { icon: 'fa-solid fa-list-check', label: 'My Tasks', href: '/manager/tasks' },
    ]},
    { section: 'Actions', items: [
      { icon: 'fa-solid fa-comment-dots', label: 'Feedback', href: '/manager/feedback' },
      { icon: 'fa-solid fa-calendar', label: 'Calendar', href: '/manager/calendar' },
    ]},
  ],
  new_hire: [
    { section: 'My Journey', items: [
      { icon: 'fa-solid fa-house', label: 'Home', href: '/hire/dashboard' },
      { icon: 'fa-solid fa-calendar-week', label: 'Week 1', href: '/hire/dashboard?week=week1' },
      { icon: 'fa-solid fa-calendar-week', label: 'Week 2', href: '/hire/dashboard?week=week2' },
      { icon: 'fa-solid fa-calendar-week', label: 'Week 3', href: '/hire/dashboard?week=week3' },
    ]},
    { section: 'Resources', items: [
      { icon: 'fa-solid fa-book', label: 'Company Wiki', href: '/hire/resources/wiki' },
      { icon: 'fa-solid fa-address-book', label: 'Key Contacts', href: '/hire/resources/contacts' },
    ]},
  ],
}

interface SidebarProps {
  user: Profile
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createSupabaseBrowser()
  const currentRole = pathname.startsWith('/hr') ? 'hr' : pathname.startsWith('/manager') ? 'manager' : 'new_hire'
  const sections = (NAV_SCHEMA as any)[currentRole] || []

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
          value={currentRole}
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
        {sections.map((sec: any) => (
          <div key={sec.section}>
            <div className="sb-nav-sec">{sec.section}</div>
            {sec.items.map((item: any) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sb-nav-item${pathname === item.href ? ' active' : ''}`}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sb-user">
        <img src={user.avatar_url || `https://i.pravatar.cc/34?u=${user.id}`} alt="user" />
        <div>
          <strong>{user.full_name}</strong>
          <span>{roleLabel[currentRole]}</span>
        </div>
        <button className="sb-logout" onClick={handleLogout} title="Log out">
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </aside>
  )
}
