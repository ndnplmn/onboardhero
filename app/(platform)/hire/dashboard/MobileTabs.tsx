'use client'

import { useState, useEffect } from 'react'

type Tab = 'today' | 'journey' | 'goals'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today',   label: 'Today',   icon: 'fa-solid fa-sun' },
  { id: 'journey', label: 'Journey', icon: 'fa-solid fa-map' },
  { id: 'goals',   label: 'Goals',   icon: 'fa-solid fa-flag' },
]

interface MobileTabsProps {
  children: {
    today:   React.ReactNode
    journey: React.ReactNode
    goals:   React.ReactNode
  }
}

export default function MobileTabs({ children }: MobileTabsProps) {
  const [active, setActive] = useState<Tab>('today')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (!isMobile) {
    return (
      <>
        {children.today}
        {children.journey}
        {children.goals}
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Tab bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: '10px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: active === t.id ? '2px solid var(--cyan)' : '2px solid transparent',
              color: active === t.id ? 'var(--cyan)' : 'var(--text3)',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            <i className={t.icon} style={{ fontSize: 15 }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {active === 'today'   && children.today}
        {active === 'journey' && children.journey}
        {active === 'goals'   && children.goals}
      </div>
    </div>
  )
}
