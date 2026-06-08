'use client'

import { useT } from '@/lib/i18n/context'

interface SectionDividerProps {
  labelKey: string
  icon: string
}

export default function SectionDivider({ labelKey, icon }: SectionDividerProps) {
  const { t } = useT()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 -4px' }}>
      <i className={icon} style={{ fontSize: 12, color: 'var(--cyan)', flexShrink: 0 }} aria-hidden="true" />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)' }}>
        {t(labelKey)}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}
