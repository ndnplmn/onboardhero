'use client'

import { useState } from 'react'

interface CollapseSectionProps {
  label: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}

export default function CollapseSection({ label, count, defaultOpen = false, children }: CollapseSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px 0',
          color: 'var(--text3)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textAlign: 'left',
        }}
        aria-expanded={open}
      >
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
          {open ? 'Hide' : 'Show'} {label}
          {count != null && (
            <span style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 100, padding: '1px 6px', fontSize: 10 }}>
              {count}
            </span>
          )}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <i
          className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`}
          style={{ fontSize: 9, transition: 'transform 0.2s' }}
        />
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)', marginTop: 8 }}>
          {children}
        </div>
      )}
    </div>
  )
}
