'use client'

import { useState, useEffect } from 'react'

export interface PreboardingTask {
  icon: string   // FontAwesome class e.g. "fa-solid fa-envelope"
  label: string
  href?: string
}

const DEFAULT_TASKS: PreboardingTask[] = [
  { icon: 'fa-solid fa-file-signature',        label: 'Confirm your offer letter is signed' },
  { icon: 'fa-solid fa-clipboard-list',        label: 'Complete your personal information form' },
  { icon: 'fa-solid fa-book-open',             label: 'Read the company handbook',         href: '/hire/resources/wiki' },
  { icon: 'fa-solid fa-laptop',                label: 'Submit your IT equipment request' },
  { icon: 'fa-solid fa-handshake',             label: 'Connect with your onboarding buddy' },
]

interface Props {
  journeyId:  string
  tasks:      PreboardingTask[]
}

export default function PreboardingChecklist({ journeyId, tasks }: Props) {
  const storageKey = `preboarding_done_${journeyId}`
  const items      = tasks.length > 0 ? tasks : DEFAULT_TASKS

  const [done, setDone] = useState<Set<number>>(new Set())

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as number[]
      setDone(new Set(saved))
    } catch { /* ignore */ }
  }, [storageKey])

  function toggle(idx: number) {
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      try { localStorage.setItem(storageKey, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }

  const completedCount = done.size

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        padding: '28px 32px',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 'var(--r)',
          background: 'var(--grad)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <i className="fa-solid fa-list-check" style={{ fontSize: 14, color: '#fff' }} aria-hidden="true" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            Preboarding Checklist
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {completedCount}/{items.length} completed before day one
          </div>
        </div>
        {completedCount === items.length && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px',
            borderRadius: 100, background: 'var(--green-bg)', color: 'var(--green)',
            border: '1px solid rgba(34,197,94,0.2)',
          }}>
            <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }} />
            All done!
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden', marginBottom: 18 }}>
        <div style={{
          height: '100%',
          width: `${items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0}%`,
          background: completedCount === items.length ? 'var(--green)' : 'var(--grad)',
          borderRadius: 100,
          transition: 'width 0.4s var(--ease)',
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, idx) => {
          const isDone = done.has(idx)
          return (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                background: isDone ? 'var(--green-bg)' : 'var(--surface2)',
                border: `1px solid ${isDone ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
                borderRadius: 'var(--r)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                width: '100%',
              }}
              aria-pressed={isDone}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${isDone ? 'var(--green)' : 'var(--border)'}`,
                background: isDone ? 'var(--green)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {isDone && <i className="fa-solid fa-check" style={{ fontSize: 9, color: '#fff' }} />}
              </div>
              <i
                className={item.icon}
                style={{ fontSize: 15, color: isDone ? 'var(--green)' : 'var(--text3)', flexShrink: 0 }}
                aria-hidden="true"
              />
              <span style={{
                fontSize: 14, flex: 1,
                color: isDone ? 'var(--text3)' : 'var(--text)',
                fontWeight: isDone ? 400 : 500,
                textDecoration: isDone ? 'line-through' : 'none',
              }}>
                {item.href && !isDone ? (
                  <a
                    href={item.href}
                    onClick={e => e.stopPropagation()}
                    style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}
                  >
                    {item.label}
                    <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 10, marginLeft: 5, opacity: 0.7 }} aria-hidden="true" />
                  </a>
                ) : item.label}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
        <a
          href="/hire/resources/wiki"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--grad)', color: '#fff',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            padding: '12px 28px', borderRadius: 'var(--r)', textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(0,200,224,0.3)',
          }}
        >
          <i className="fa-solid fa-book-open" aria-hidden="true" />
          Get a head start — explore the company wiki
          <i className="fa-solid fa-arrow-right" style={{ fontSize: 12 }} aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
