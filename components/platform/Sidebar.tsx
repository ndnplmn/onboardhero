'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/db/supabase-client'
import type { Profile } from '@/lib/db/types'
import Link from 'next/link'
import NotificationBell from '@/components/platform/NotificationBell'
import LanguageToggle from '@/components/platform/LanguageToggle'
import ThemeToggle from '@/components/platform/ThemeToggle'
import { useT } from '@/lib/i18n/context'

interface SidebarProps {
  user: Profile
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createSupabaseBrowser()
  const [open, setOpen] = useState(false)
  const { t } = useT()

  const currentRole = pathname.startsWith('/hr') ? 'hr' : pathname.startsWith('/manager') ? 'manager' : 'new_hire'

  const NAV_SCHEMA = {
    hr: [
      { sectionKey: 'sidebar.sections.main', items: [
        { icon: 'fa-solid fa-gauge-high',          labelKey: 'sidebar.nav.dashboard',      href: '/hr/dashboard'  },
        { icon: 'fa-solid fa-users',               labelKey: 'sidebar.nav.allEmployees',   href: '/hr/employees'  },
        { icon: 'fa-solid fa-route',               labelKey: 'sidebar.nav.journeyBuilder', href: '/hr/journeys'   },
        { icon: 'fa-solid fa-list-check',          labelKey: 'sidebar.nav.taskManager',    href: '/hr/tasks'      },
      ]},
      { sectionKey: 'sidebar.sections.content', items: [
        { icon: 'fa-solid fa-wand-magic-sparkles', labelKey: 'sidebar.nav.contentStudio',  href: '/hr/content' },
        { icon: 'fa-solid fa-file-circle-check',   labelKey: 'sidebar.nav.forms',          href: '/hr/forms'   },
        { icon: 'fa-solid fa-book-open',           labelKey: 'sidebar.nav.companyWiki',    href: '/hr/wiki'    },
      ]},
      { sectionKey: 'sidebar.sections.analytics', items: [
        { icon: 'fa-solid fa-chart-bar',           labelKey: 'sidebar.nav.reports',        href: '/hr/analytics' },
        { icon: 'fa-solid fa-bell',                labelKey: 'sidebar.nav.alerts',         href: '/hr/alerts'    },
        { icon: 'fa-solid fa-calendar',            labelKey: 'sidebar.nav.calendar',       href: '/hr/calendar'  },
      ]},
      { sectionKey: 'sidebar.sections.account', items: [
        { icon: 'fa-solid fa-robot',               labelKey: 'sidebar.nav.aiAssistant',    href: '/hr/chat'    },
        { icon: 'fa-solid fa-user-circle',         labelKey: 'sidebar.nav.myProfile',      href: '/hr/profile' },
        { icon: 'fa-solid fa-gear',                labelKey: 'sidebar.nav.settings',       href: '/hr/settings'},
      ]},
    ],
    manager: [
      { sectionKey: 'sidebar.sections.overview', items: [
        { icon: 'fa-solid fa-gauge-high',          labelKey: 'sidebar.nav.dashboard',      href: '/manager/dashboard' },
        { icon: 'fa-solid fa-person',              labelKey: 'sidebar.nav.myNewHires',     href: '/manager/hires'     },
        { icon: 'fa-solid fa-list-check',          labelKey: 'sidebar.nav.myTasks',        href: '/manager/tasks'     },
      ]},
      { sectionKey: 'sidebar.sections.coaching', items: [
        { icon: 'fa-solid fa-brain',               labelKey: 'sidebar.nav.coachingHub',    href: '/manager/coaching'  },
        { icon: 'fa-solid fa-masks-theater',       labelKey: 'sidebar.nav.roleplay',       href: '/manager/roleplay'  },
        { icon: 'fa-solid fa-comment-dots',        labelKey: 'sidebar.nav.feedback',       href: '/manager/feedback'  },
        { icon: 'fa-solid fa-calendar',            labelKey: 'sidebar.nav.calendar',       href: '/manager/calendar'  },
      ]},
      { sectionKey: 'sidebar.sections.resources', items: [
        { icon: 'fa-solid fa-book-open',           labelKey: 'sidebar.nav.companyWiki',    href: '/manager/wiki'   },
        { icon: 'fa-solid fa-bell',                labelKey: 'sidebar.nav.alerts',         href: '/manager/alerts' },
      ]},
      { sectionKey: 'sidebar.sections.account', items: [
        { icon: 'fa-solid fa-robot',               labelKey: 'sidebar.nav.aiAssistant',    href: '/manager/chat'    },
        { icon: 'fa-solid fa-user-circle',         labelKey: 'sidebar.nav.myProfile',      href: '/manager/profile' },
      ]},
    ],
    new_hire: [
      { sectionKey: 'sidebar.sections.myJourney', items: [
        { icon: 'fa-solid fa-house',               labelKey: 'sidebar.nav.home',           href: '/hire/dashboard' },
        { icon: 'fa-solid fa-list-check',          labelKey: 'sidebar.nav.myTasks',        href: '/hire/tasks'     },
        { icon: 'fa-solid fa-file-pen',            labelKey: 'sidebar.nav.forms',          href: '/hire/forms'     },
        { icon: 'fa-solid fa-calendar-days',       labelKey: 'sidebar.nav.mySchedule',     href: '/hire/calendar'  },
      ]},
      { sectionKey: 'sidebar.sections.resources', items: [
        { icon: 'fa-solid fa-book-open',           labelKey: 'sidebar.nav.companyWiki',    href: '/hire/resources/wiki'     },
        { icon: 'fa-solid fa-address-book',        labelKey: 'sidebar.nav.keyContacts',    href: '/hire/resources/contacts' },
        { icon: 'fa-solid fa-folder-open',         labelKey: 'sidebar.nav.resources',      href: '/hire/resources'          },
      ]},
      { sectionKey: 'sidebar.sections.account', items: [
        { icon: 'fa-solid fa-user-circle',         labelKey: 'sidebar.nav.myProfile',      href: '/hire/profile' },
        { icon: 'fa-solid fa-robot',               labelKey: 'sidebar.nav.aiAssistant',    href: '/hire/chat'    },
        { icon: 'fa-solid fa-bell',                labelKey: 'sidebar.nav.myAlerts',       href: '/hire/alerts'  },
      ]},
    ],
  }

  const sections = (NAV_SCHEMA as any)[currentRole] || []

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      {/* Mobile top bar (visible only on mobile) */}
      <div className="sb-mobile-bar">
        <button
          className="sb-hamburger"
          onClick={() => setOpen(true)}
          aria-label={t('sidebar.openMenu')}
          aria-expanded={open}
        >
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button>
        <img src="/ONBOARD_HERO_LOGO.png" alt="OnboardHero" className="sb-mobile-logo" />
        <NotificationBell userId={user.id} />
      </div>

      {/* Backdrop overlay */}
      {open && (
        <div
          className="sb-overlay"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside className={`app-sidebar${open ? ' sb-open' : ''}`} aria-label={t('sidebar.nav.dashboard')}>

        {/* Close button (mobile only) */}
        <button
          className="sb-close"
          onClick={() => setOpen(false)}
          aria-label={t('sidebar.closeMenu')}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>

        <div className="sb-logo">
          <img src="/ONBOARD_HERO_LOGO.png" alt="OnboardHero" className="sb-logo-img" />
        </div>

        <div className="sb-role-switcher">
          <label htmlFor="sb-role-select">{t('sidebar.viewMode')}</label>
          <select
            id="sb-role-select"
            value={currentRole}
            onChange={(e) => {
              const role = e.target.value
              if (role === 'hr')           router.push('/hr/dashboard')
              else if (role === 'manager') router.push('/manager/dashboard')
              else                         router.push('/hire/dashboard')
            }}
          >
            <option value="hr">{t('sidebar.roleLabels.hr')}</option>
            <option value="manager">{t('sidebar.roleLabels.manager')}</option>
            <option value="new_hire">{t('sidebar.roleLabels.newHire')}</option>
          </select>
        </div>

        <nav className="sb-nav" aria-label="Site navigation">
          {sections.map((sec: any) => (
            <div key={sec.sectionKey}>
              <div className="sb-nav-sec">{t(sec.sectionKey)}</div>
              {sec.items.map((item: any) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sb-nav-item${isActive ? ' active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <i className={item.icon} aria-hidden="true" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Language + Theme toggles */}
        <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('sidebar.language')}
            </span>
            <LanguageToggle />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>

        <div className="sb-user">
          <img
            src={user.avatar_url || `https://i.pravatar.cc/34?u=${user.id}`}
            alt={user.full_name ?? 'User avatar'}
            width={32}
            height={32}
          />
          <div>
            <strong>{user.full_name}</strong>
            <span>{t(`sidebar.roleLabels.${currentRole === 'new_hire' ? 'newHire' : currentRole}`)}</span>
          </div>
          <button className="sb-logout" onClick={handleLogout} aria-label={t('sidebar.logout')}>
            <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
          </button>
        </div>
      </aside>
    </>
  )
}
