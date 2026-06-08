'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/context'

interface AuraNudgeBannerProps {
  dayNumber: number
  pendingTasks: number
  nextCheckIn: string | null
  managerName: string | undefined
  proactiveMessage?: string | null
}

function openAura() {
  window.dispatchEvent(new CustomEvent('aura-open'))
}

export default function AuraNudgeBanner({
  dayNumber,
  pendingTasks,
  nextCheckIn,
  managerName,
  proactiveMessage,
}: AuraNudgeBannerProps) {
  const { t } = useT()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Determine which message to show (most relevant first)
  let message: React.ReactNode = null
  let buttonLabel = t('components.auraNudgeBanner.openAura')
  let isProactive = false

  // Check if nextCheckIn is within 24 hours from now
  const isCheckInWithin24h = (() => {
    if (!nextCheckIn) return false
    const checkInTime = new Date(nextCheckIn).getTime()
    const now = Date.now()
    const in24h = now + 24 * 60 * 60 * 1000
    return checkInTime >= now && checkInTime <= in24h
  })()

  if (isCheckInWithin24h) {
    const mgr = managerName ?? 'your manager'
    message = <>{t('components.auraNudgeBanner.checkInPre')} <strong>{mgr}</strong> {t('components.auraNudgeBanner.checkInPost')}</>
    buttonLabel = t('components.auraNudgeBanner.openAura')
  } else if (pendingTasks >= 3) {
    message = <>{t('components.auraNudgeBanner.tasksPre')} <strong>{pendingTasks} {t('components.welcomeBanner.tasks')}</strong> {t('components.auraNudgeBanner.tasksPost')}</>
    buttonLabel = t('components.auraNudgeBanner.askNow')
  } else if (proactiveMessage) {
    // AI-generated personalized daily message (highest value when no urgent signal)
    message = <>{proactiveMessage}</>
    buttonLabel = t('components.auraNudgeBanner.askAura')
    isProactive = true
  } else if (dayNumber >= 28 && dayNumber <= 32) {
    message = <>{t('components.auraNudgeBanner.milestone30')}</>
    buttonLabel = t('components.auraNudgeBanner.openAura')
  } else {
    return null
  }

  const accent = isProactive ? 'var(--violet)' : 'var(--blue)'

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderRadius: 'var(--r)',
        background: `color-mix(in srgb, ${accent} 8%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <i
        className={isProactive ? 'fa-solid fa-wand-magic-sparkles' : 'fa-solid fa-sparkles'}
        style={{ fontSize: 13, color: accent, flexShrink: 0 }}
        aria-hidden="true"
      />

      <p style={{ flex: 1, fontSize: 13, color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>
        {message}
      </p>

      <button
        onClick={openAura}
        style={{
          flexShrink: 0,
          background: accent,
          border: 'none',
          borderRadius: 'var(--r)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          padding: '5px 12px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {buttonLabel}
      </button>

      <button
        onClick={() => setDismissed(true)}
        aria-label={t('components.auraNudgeBanner.dismiss')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 'var(--r)',
          color: 'var(--text3)',
          flexShrink: 0,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className="fa-solid fa-xmark" style={{ fontSize: 13 }} aria-hidden="true" />
      </button>
    </div>
  )
}
