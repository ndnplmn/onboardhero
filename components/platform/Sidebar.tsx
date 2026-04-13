'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/db/supabase-client'
import type { Profile } from '@/lib/db/types'
import Link from 'next/link'

const NAV_SCHEMA = {
  hr: [
    { section: 'Main', items: [
      { icon: 'fa-solid fa-gauge-high',   label: 'Dashboard',      href: '/hr/dashboard'  },
      { icon: 'fa-solid fa-users',         label: 'All Employees',  href: '/hr/employees'  },
      { icon: 'fa-solid fa-route',         label: 'Journey Builder',href: '/hr/journeys'   },
      { icon: 'fa-solid fa-list-check',    label: 'Task Manager',   href: '/hr/tasks'      },
    ]},
    { section: 'Content', items: [
      { icon: 'fa-solid fa-wand-magic-sparkles', label: 'Content Studio', href: '/hr/content' },
      { icon: 'fa-solid fa-file-circle-check',   label: 'Forms',          href: '/hr/forms'   },
      { icon: 'fa-solid fa-book-open',           label: 'Company Wiki',   href: '/hr/wiki'    },
    ]},
    { section: 'Analytics', items: [
      { icon: 'fa-solid fa-chart-bar', label: 'Reports', href: '/hr/analytics' },
      { icon: 'fa-solid fa-bell',      label: 'Alerts',  href: '/hr/alerts'    },
      { icon: 'fa-solid fa-calendar',  label: 'Calendar',href: '/hr/calendar'  },
    ]},
    { section: 'Account', items: [
      { icon: 'fa-solid fa-robot',       label: 'AI Assistant', href: '/hr/chat'    },
      { icon: 'fa-solid fa-user-circle', label: 'My Profile',   href: '/hr/profile' },
      { icon: 'fa-solid fa-gear',        label: 'Settings',     href: '/hr/settings'},
    ]},
  ],
  manager: [
    { section: 'Overview', items: [
      { icon: 'fa-solid fa-gauge-high', label: 'Dashboard',    href: '/manager/dashboard' },
      { icon: 'fa-solid fa-person',     label: 'My New Hires', href: '/manager/hires'     },
      { icon: 'fa-solid fa-list-check', label: 'My Tasks',     href: '/manager/tasks'     },
    ]},
    { section: 'Coaching', items: [
      { icon: 'fa-solid fa-brain',        label: 'Coaching Hub', href: '/manager/coaching'  },
      { icon: 'fa-solid fa-comment-dots', label: 'Feedback',     href: '/manager/feedback'  },
      { icon: 'fa-solid fa-calendar',     label: 'Calendar',     href: '/manager/calendar'  },
    ]},
    { section: 'Resources', items: [
      { icon: 'fa-solid fa-book-open', label: 'Company Wiki', href: '/manager/wiki' },
      { icon: 'fa-solid fa-bell',      label: 'Alerts',       href: '/manager/alerts' },
    ]},
    { section: 'Account', items: [
      { icon: 'fa-solid fa-robot',       label: 'AI Assistant', href: '/manager/chat'    },
      { icon: 'fa-solid fa-user-circle', label: 'My Profile',   href: '/manager/profile' },
    ]},
  ],
  new_hire: [
    { section: 'My Journey', items: [
      { icon: 'fa-solid fa-house',      label: 'Home',     href: '/hire/dashboard' },
      { icon: 'fa-solid fa-list-check', label: 'My Tasks', href: '/hire/tasks'     },
      { icon: 'fa-solid fa-file-pen',   label: 'Forms',    href: '/hire/forms'     },
      { icon: 'fa-solid fa-calendar-days', label: 'My Schedule', href: '/hire/calendar' },
    ]},
    { section: 'Resources', items: [
      { icon: 'fa-solid fa-book-open',    label: 'Company Wiki',  href: '/hire/resources/wiki'     },
      { icon: 'fa-solid fa-address-book', label: 'Key Contacts',  href: '/hire/resources/contacts' },
      { icon: 'fa-solid fa-folder-open',  label: 'Resources',     href: '/hire/resources'          },
    ]},
    { section: 'Account', items: [
      { icon: 'fa-solid fa-user-circle', label: 'My Profile',   href: '/hire/profile' },
      { icon: 'fa-solid fa-robot',       label: 'AI Assistant', href: '/hire/chat'    },
      { icon: 'fa-solid fa-bell',        label: 'My Alerts',    href: '/hire/alerts'  },
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
            {sec.items.map((item: any) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sb-nav-item${isActive ? ' active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <i className={item.icon} aria-hidden="true"></i>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="sb-user">
        <img src={user.avatar_url || `https://i.pravatar.cc/34?u=${user.id}`} alt={user.full_name} />
        <div>
          <strong>{user.full_name}</strong>
          <span>{roleLabel[currentRole]}</span>
        </div>
        <button className="sb-logout" onClick={handleLogout} aria-label="Log out">
          <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
        </button>
      </div>
    </aside>
  )
}
