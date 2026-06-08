'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Command {
  id: string
  label: string
  description?: string
  icon: string
  color: string
  action: () => void
  keywords: string[]
}

function useCommands(router: ReturnType<typeof useRouter>, pathname: string): Command[] {
  const role = pathname.startsWith('/hr') ? 'hr' : pathname.startsWith('/manager') ? 'manager' : 'hire'

  const hrCommands: Command[] = [
    { id: 'hr-dash',      label: 'HR Dashboard',        icon: 'fa-solid fa-gauge-high',           color: 'var(--cyan)',  action: () => router.push('/hr/dashboard'),  keywords: ['dashboard', 'home', 'overview'] },
    { id: 'hr-emp',       label: 'All Employees',        icon: 'fa-solid fa-users',                color: 'var(--blue)',  action: () => router.push('/hr/employees'),  keywords: ['employees', 'team', 'people'] },
    { id: 'hr-journeys',  label: 'Journey Builder',      icon: 'fa-solid fa-route',                color: 'var(--aqua)',  action: () => router.push('/hr/journeys'),   keywords: ['journeys', 'templates', 'builder'] },
    { id: 'hr-analytics', label: 'Analytics & Reports',  icon: 'fa-solid fa-chart-bar',            color: 'var(--blue)',  action: () => router.push('/hr/analytics'),  keywords: ['analytics', 'reports', 'data', 'benchmark'] },
    { id: 'hr-alerts',    label: 'Active Alerts',        icon: 'fa-solid fa-bell',                 color: 'var(--red)',   action: () => router.push('/hr/alerts'),     keywords: ['alerts', 'notifications', 'risk'] },
    { id: 'hr-content',   label: 'Content Studio',       icon: 'fa-solid fa-wand-magic-sparkles',  color: 'var(--cyan)',  action: () => router.push('/hr/content'),    keywords: ['content', 'ai', 'generate', 'email'] },
    { id: 'hr-forms',     label: 'Forms',                icon: 'fa-solid fa-file-pen',             color: 'var(--blue)',  action: () => router.push('/hr/forms'),      keywords: ['forms', 'surveys'] },
    { id: 'hr-wiki',      label: 'Company Wiki',         icon: 'fa-solid fa-book-open',            color: 'var(--aqua)',  action: () => router.push('/hr/wiki'),       keywords: ['wiki', 'knowledge', 'docs'] },
    { id: 'hr-settings',  label: 'Settings',             icon: 'fa-solid fa-gear',                 color: 'var(--text3)', action: () => router.push('/hr/settings'),   keywords: ['settings', 'config', 'preferences'] },
  ]

  const managerCommands: Command[] = [
    // ── Navigation
    { id: 'mgr-dash',     label: 'Manager Dashboard',    icon: 'fa-solid fa-gauge-high',           color: 'var(--cyan)',  action: () => router.push('/manager/dashboard'), keywords: ['dashboard', 'home', 'overview'] },
    { id: 'mgr-hires',    label: 'My New Hires',         icon: 'fa-solid fa-person',               color: 'var(--blue)',  action: () => router.push('/manager/hires'),     keywords: ['hires', 'team', 'employees', 'new hire'] },
    { id: 'mgr-tasks',    label: 'My Tasks',             icon: 'fa-solid fa-list-check',           color: 'var(--aqua)',  action: () => router.push('/manager/tasks'),     keywords: ['tasks', 'todo', 'pending'] },
    { id: 'mgr-coaching', label: 'Coaching Hub',         icon: 'fa-solid fa-brain',                color: 'var(--cyan)',  action: () => router.push('/manager/coaching'),  keywords: ['coaching', 'ai', '1on1', 'checkin'] },
    { id: 'mgr-roleplay', label: 'Leadership Simulation',icon: 'fa-solid fa-masks-theater',        color: 'var(--blue)',  action: () => router.push('/manager/roleplay'),  keywords: ['roleplay', 'simulation', 'practice', 'leadership'] },
    { id: 'mgr-feedback', label: 'Team Feedback',        icon: 'fa-solid fa-comment-dots',         color: 'var(--green)', action: () => router.push('/manager/feedback'),  keywords: ['feedback', 'sentiment', 'ratings'] },
    { id: 'mgr-calendar', label: 'Calendar',             icon: 'fa-solid fa-calendar',             color: 'var(--blue)',  action: () => router.push('/manager/calendar'),  keywords: ['calendar', 'schedule', 'meetings', 'checkin'] },
    { id: 'mgr-wiki',     label: 'Company Wiki',         icon: 'fa-solid fa-book-open',            color: 'var(--aqua)',  action: () => router.push('/manager/wiki'),      keywords: ['wiki', 'knowledge', 'docs'] },
    // ── Quick actions
    { id: 'mgr-aura',     label: 'Open Aura Assistant',  icon: 'fa-solid fa-sparkles',             color: 'var(--cyan)',  action: () => window.dispatchEvent(new CustomEvent('aura-open')),
      description: 'Get AI coaching for your team', keywords: ['aura', 'ai', 'assistant', 'coaching', 'help'] },
    { id: 'mgr-nudge',    label: 'Send Nudge to Hire',   icon: 'fa-solid fa-hand-point-right',     color: 'var(--blue)',  action: () => window.dispatchEvent(new CustomEvent('open-nudge-modal')),
      description: 'Send a quick check-in nudge', keywords: ['nudge', 'message', 'ping', 'remind', 'send'] },
    { id: 'mgr-checkin',  label: 'Schedule Check-in',    icon: 'fa-solid fa-calendar-plus',        color: 'var(--green)', action: () => router.push('/manager/calendar'),
      description: 'Book a 1:1 with a hire', keywords: ['schedule', 'checkin', '1on1', 'book', 'meeting'] },
  ]

  const hireCommands: Command[] = [
    // ── Navigation
    { id: 'hire-dash',    label: 'My Journey',           icon: 'fa-solid fa-house',                color: 'var(--cyan)',  action: () => router.push('/hire/dashboard'),          keywords: ['home', 'dashboard', 'journey'] },
    { id: 'hire-tasks',   label: 'My Tasks',             icon: 'fa-solid fa-list-check',           color: 'var(--blue)',  action: () => router.push('/hire/tasks'),              keywords: ['tasks', 'todo', 'pending'] },
    { id: 'hire-cal',     label: 'My Schedule',          icon: 'fa-solid fa-calendar-days',        color: 'var(--blue)',  action: () => router.push('/hire/calendar'),           keywords: ['calendar', 'schedule', 'meetings'] },
    { id: 'hire-wiki',    label: 'Company Wiki',         icon: 'fa-solid fa-book-open',            color: 'var(--aqua)',  action: () => router.push('/hire/resources/wiki'),     keywords: ['wiki', 'knowledge', 'docs'] },
    { id: 'hire-contacts',label: 'Key Contacts',         icon: 'fa-solid fa-address-book',         color: 'var(--cyan)',  action: () => router.push('/hire/resources/contacts'), keywords: ['contacts', 'people', 'manager', 'buddy'] },
    { id: 'hire-res',     label: 'Resources',            icon: 'fa-solid fa-folder-open',          color: 'var(--blue)',  action: () => router.push('/hire/resources'),          keywords: ['resources', 'docs', 'links', 'files'] },
    // ── Quick actions (no navigation needed)
    { id: 'hire-aura',    label: 'Open Aura Assistant',  icon: 'fa-solid fa-sparkles',             color: 'var(--cyan)',  action: () => window.dispatchEvent(new CustomEvent('aura-open')),
      description: 'Chat with your AI onboarding assistant', keywords: ['aura', 'ai', 'assistant', 'help', 'chat'] },
    { id: 'hire-blocker', label: 'Report a Blocker',     icon: 'fa-solid fa-triangle-exclamation', color: 'var(--amber)', action: () => { router.push('/hire/dashboard'); setTimeout(() => window.dispatchEvent(new CustomEvent('open-blocker-modal')), 300) },
      description: 'Flag something blocking your progress', keywords: ['blocker', 'issue', 'stuck', 'help', 'report', 'friction'] },
    { id: 'hire-pulse',   label: 'Submit Weekly Pulse',  icon: 'fa-solid fa-heart-pulse',          color: 'var(--red)',   action: () => { router.push('/hire/dashboard'); setTimeout(() => window.dispatchEvent(new CustomEvent('open-pulse')), 300) },
      description: 'Rate how this week is going', keywords: ['pulse', 'mood', 'rating', 'wellbeing', 'checkin'] },
  ]

  const global: Command[] = [
    { id: 'theme',        label: 'Toggle Dark Mode',     description: 'Switch light/dark theme',   icon: 'fa-solid fa-moon', color: 'var(--text2)', action: () => {
      const cur = document.documentElement.getAttribute('data-theme')
      const next = cur === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('oh-theme', next)
    }, keywords: ['dark', 'light', 'theme', 'mode'] },
  ]

  const roleCommands = role === 'hr' ? hrCommands : role === 'manager' ? managerCommands : hireCommands
  return [...roleCommands, ...global]
}

export default function CommandPalette() {
  const router   = useRouter()
  const pathname = usePathname()
  const commands = useCommands(router, pathname)

  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef  = useRef<HTMLInputElement>(null)
  const listRef   = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : commands

  useEffect(() => { setActiveIdx(0) }, [query])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
        setQuery('')
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  function run(cmd: Command) {
    cmd.action()
    setOpen(false)
    setQuery('')
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[activeIdx]) run(filtered[activeIdx])
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '14vh',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 0 0 1px var(--border)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        maxHeight: '60vh',
      }}>
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text3)', fontSize: 14, flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, actions..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent',
              fontSize: 15, color: 'var(--text)',
              fontFamily: 'var(--font-body)',
            }}
          />
          <kbd style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 5,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            color: 'var(--text3)', fontFamily: 'var(--font-body)', flexShrink: 0,
          }}>
            esc
          </kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} style={{ overflowY: 'auto', padding: '6px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                data-idx={idx}
                onClick={() => run(cmd)}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 18px',
                  background: idx === activeIdx ? 'var(--surface2)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `${cmd.color}18`,
                  border: `1px solid ${cmd.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={cmd.icon} style={{ fontSize: 13, color: cmd.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{cmd.label}</div>
                  {cmd.description && (
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{cmd.description}</div>
                  )}
                </div>
                {idx === activeIdx && (
                  <kbd style={{
                    marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 4,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: 'var(--text3)', fontFamily: 'var(--font-body)',
                  }}>
                    ↵
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '8px 18px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 16, fontSize: 11, color: 'var(--text3)',
        }}>
          <span><kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'var(--surface2)', border: '1px solid var(--border)', fontFamily: 'inherit' }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'var(--surface2)', border: '1px solid var(--border)', fontFamily: 'inherit' }}>↵</kbd> open</span>
          <span><kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'var(--surface2)', border: '1px solid var(--border)', fontFamily: 'inherit' }}>esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
