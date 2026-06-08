'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useT } from '@/lib/i18n/context'

interface MilestoneCelebrationProps {
  journeyId:       string
  dayNumber:       number
  userName:        string
  tasksCompleted:  number
  totalTasks:      number
  checkInsCompleted: number
  goalsSet:        number
}

const MILESTONES: Record<number, { icon: string; dayKey: string; color: string; glow: string }> = {
  1:  { icon: '🚀', dayKey: 'day1',  color: '#00C8E0', glow: 'rgba(0,200,224,0.35)' },
  7:  { icon: '🏅', dayKey: 'day7',  color: '#8B5CF6', glow: 'rgba(139,92,246,0.35)' },
  30: { icon: '🎯', dayKey: 'day30', color: '#F59E0B', glow: 'rgba(245,158,11,0.35)' },
  60: { icon: '📈', dayKey: 'day60', color: '#10B981', glow: 'rgba(16,185,129,0.35)' },
  90: { icon: '🏆', dayKey: 'day90', color: '#EF4444', glow: 'rgba(239,68,68,0.35)' },
}

const MILESTONE_DAYS = [1, 7, 30, 60, 90]

function storageKey(journeyId: string, day: number) {
  return `milestone_celebrated_${journeyId}_day${day}`
}

function shouldShow(journeyId: string, dayNumber: number): number | null {
  for (const day of MILESTONE_DAYS) {
    if (dayNumber >= day && dayNumber <= day + 1) {
      try {
        if (!localStorage.getItem(storageKey(journeyId, day))) return day
      } catch { /* ignore */ }
    }
  }
  return null
}

function markShown(journeyId: string, day: number) {
  try { localStorage.setItem(storageKey(journeyId, day), '1') } catch { /* ignore */ }
}

// ── Confetti particle ──────────────────────────────────────────────────────

function Confetti({ color }: { color: string }) {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.4,
    dur: 2.2 + Math.random() * 1.6,
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
    hue: [color, '#ffffff', '#fbbf24', '#818cf8', '#34d399'][i % 5],
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: p.rotate }}
          animate={{ y: '105vh', opacity: [1, 1, 0], rotate: p.rotate + 720 }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            top: 0,
            width: p.size,
            height: p.size * 0.4,
            borderRadius: 2,
            background: p.hue,
          }}
        />
      ))}
    </div>
  )
}

// ── Stat pill ──────────────────────────────────────────────────────────────

function StatPill({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '14px 20px', borderRadius: 16,
      background: `color-mix(in srgb, ${color} 10%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
      minWidth: 90,
    }}>
      <i className={icon} style={{ fontSize: 16, color }} />
      <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-display)', color }}>{value}</span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.05em', textAlign: 'center' }}>{label}</span>
    </div>
  )
}

export default function MilestoneCelebration({
  journeyId, dayNumber, userName, tasksCompleted, totalTasks, checkInsCompleted, goalsSet,
}: MilestoneCelebrationProps) {
  const { t } = useT()
  const [milestoneDay, setMilestoneDay] = useState<number | null>(null)
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true
    const timer = setTimeout(() => {
      const day = shouldShow(journeyId, dayNumber)
      if (day !== null) {
        markShown(journeyId, day)
        setMilestoneDay(day)
      }
    }, 1600)
    return () => clearTimeout(timer)
  }, [journeyId, dayNumber])

  const config = milestoneDay !== null ? MILESTONES[milestoneDay] : null

  return (
    <AnimatePresence>
      {config && milestoneDay !== null && (
        <motion.div
          key="milestone-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(5,8,18,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)',
          }}
          onClick={() => setMilestoneDay(null)}
        >
          <Confetti color={config.color} />

          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280, delay: 0.1 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', zIndex: 1,
              background: 'linear-gradient(135deg, #0A0F1E 0%, #0D1A30 100%)',
              border: `1px solid color-mix(in srgb, ${config.color} 35%, transparent)`,
              borderRadius: 28, padding: '48px 44px 40px',
              maxWidth: 480, width: '90vw', textAlign: 'center',
              boxShadow: `0 0 80px ${config.glow}, 0 32px 80px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Glow halo */}
            <div aria-hidden="true" style={{
              position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
              width: 260, height: 260, borderRadius: '50%',
              background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            {/* Day badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: config.color, fontFamily: 'var(--font-display)',
              padding: '4px 14px', borderRadius: 100,
              background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${config.color} 25%, transparent)`,
              marginBottom: 20,
            }}>
              <i className="fa-solid fa-flag-checkered" style={{ fontSize: 9 }} />
              {t('components.milestoneCelebration.dayMilestone').replace('{day}', String(milestoneDay))}
            </div>

            {/* Big emoji */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }}
              transition={{ duration: 1.2, delay: 0.4, ease: 'easeInOut' }}
              style={{ fontSize: 64, lineHeight: 1, marginBottom: 20 }}
            >
              {config.icon}
            </motion.div>

            <h2 style={{
              fontSize: 26, fontWeight: 900, fontFamily: 'var(--font-display)',
              color: '#fff', marginBottom: 12, lineHeight: 1.2,
            }}>
              {t(`components.milestoneCelebration.milestones.${config.dayKey}.headline`)}
            </h2>

            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, marginBottom: 28, maxWidth: 360, margin: '0 auto 28px' }}>
              {t(`components.milestoneCelebration.milestones.${config.dayKey}.sub`)}
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
              <StatPill icon="fa-solid fa-list-check"     value={tasksCompleted}    label={t('components.milestoneCelebration.tasksDone')} color={config.color} />
              <StatPill icon="fa-solid fa-calendar-check" value={checkInsCompleted} label={t('components.milestoneCelebration.checkIns')}  color={config.color} />
              {goalsSet > 0 && (
                <StatPill icon="fa-solid fa-flag"         value={goalsSet}          label={t('components.milestoneCelebration.goalsSet')} color={config.color} />
              )}
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMilestoneDay(null)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `linear-gradient(135deg, ${config.color}, color-mix(in srgb, ${config.color} 60%, #8B5CF6))`,
                color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: 15, padding: '14px 36px', borderRadius: 100,
                border: 'none', cursor: 'pointer',
                boxShadow: `0 8px 24px ${config.glow}`,
              }}
            >
              <i className="fa-solid fa-arrow-right" />
              {t('components.milestoneCelebration.continueJourney')}
            </motion.button>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 14 }}>
              {t('components.milestoneCelebration.keepItUp').replace('{name}', userName.split(' ')[0])}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
