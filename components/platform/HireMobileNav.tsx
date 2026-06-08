'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/hire/dashboard', icon: 'fa-solid fa-house',         label: 'Home'     },
  { href: '/hire/tasks',     icon: 'fa-solid fa-list-check',    label: 'Tasks'    },
  { href: '/hire/calendar',  icon: 'fa-solid fa-calendar-days', label: 'Schedule' },
  { href: '/hire/resources', icon: 'fa-solid fa-folder-open',   label: 'Resources'},
  { href: '/hire/chat',      icon: 'fa-solid fa-robot',         label: 'Aura'     },
]

export default function HireMobileNav() {
  const pathname = usePathname()

  if (!pathname.startsWith('/hire')) return null

  return (
    <nav className="hire-mobile-nav" aria-label="Mobile navigation">
      {NAV.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link key={item.href} href={item.href} className={active ? 'active' : ''}>
            <i className={item.icon} aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
