'use client'

import { useT } from '@/lib/i18n/context'

interface WelcomeBannerProps {
  userName:            string
  dayNumber:           number
  avatarUrl?:          string
  pendingTaskCount?:   number
  completedThisWeek?:  number
  totalThisWeek?:      number
  nextCheckInDate?:    string | null
  managerName?:        string
  focusTaskTitle?:     string | null
  overallCompletionPct?: number
  lastPulseScore?:     number | null
  prevPulseScore?:     number | null
  riskScore?:          number | null
  cohortRankPct?:      number | null   // 0-100: hire's percentile vs cohort (higher = faster)
  completedLastWeek?:  number          // tasks completed in the previous week
}

interface JourneyArc {
  phase:         string
  narrative:     string
  phaseColor:    string
  phaseProgress: number  // 0-100 within the current phase
}

type GetJourneyArcFn = (dayNumber: number, t: (key: string) => string) => JourneyArc

const getJourneyArc: GetJourneyArcFn = (dayNumber, t) => {
  if (dayNumber <= 7) {
    return {
      phase: t('components.welcomeBanner.phase.orientationLabel'),
      narrative: t('components.welcomeBanner.phase.orientationNarrative'),
      phaseColor: '#00C8E0',
      phaseProgress: Math.round((dayNumber / 7) * 100),
    }
  }
  if (dayNumber <= 30) {
    return {
      phase: t('components.welcomeBanner.phase.foundationLabel'),
      narrative: t('components.welcomeBanner.phase.foundationNarrative'),
      phaseColor: '#1a6cf6',
      phaseProgress: Math.round(((dayNumber - 7) / 23) * 100),
    }
  }
  if (dayNumber <= 60) {
    return {
      phase: t('components.welcomeBanner.phase.integrationLabel'),
      narrative: t('components.welcomeBanner.phase.integrationNarrative'),
      phaseColor: '#a855f7',
      phaseProgress: Math.round(((dayNumber - 30) / 30) * 100),
    }
  }
  return {
    phase: t('components.welcomeBanner.phase.masteryLabel'),
    narrative: t('components.welcomeBanner.phase.masteryNarrative'),
    phaseColor: '#22c55e',
    phaseProgress: Math.min(100, Math.round(((dayNumber - 60) / 30) * 100)),
  }
}

function getDailyInsight(props: WelcomeBannerProps): string | null {
  const { dayNumber, completedThisWeek = 0, totalThisWeek = 0, overallCompletionPct, lastPulseScore, prevPulseScore, cohortRankPct, completedLastWeek } = props

  // Priority 1 — critical interventions
  if (lastPulseScore != null && lastPulseScore <= 2) {
    return `Pulse at ${lastPulseScore}/5 last week. Hires who share blockers early get resolved 3× faster — use the friction reporter.`
  }
  if (overallCompletionPct != null && overallCompletionPct > 0 && overallCompletionPct - 65 < -10) {
    return `Your overall completion is ${overallCompletionPct}% — completing 2 more tasks this week would bring you to the average.`
  }

  // Priority 2 — cohort comparison (highest engagement driver when positive)
  if (cohortRankPct != null && cohortRankPct >= 75) {
    return `You're in the top ${100 - cohortRankPct}% of your cohort for task completion — exceptional onboarding pace.`
  }
  if (cohortRankPct != null && cohortRankPct >= 50) {
    return `You're completing tasks faster than ${cohortRankPct}% of hires in your cohort. Keep the momentum going!`
  }

  // Priority 3 — pulse improvement story
  if (lastPulseScore != null && prevPulseScore != null && lastPulseScore > prevPulseScore) {
    return `Your morale went from ${prevPulseScore}/5 → ${lastPulseScore}/5 last week — that upward trend is exactly what strong onboarding looks like.`
  }

  // Priority 4 — positive reinforcement
  if (totalThisWeek > 0 && completedThisWeek === totalThisWeek) {
    return 'You finished all tasks this week — that puts you in the top 20% of onboarding hires.'
  }
  if (completedLastWeek != null && completedLastWeek >= 3) {
    return `You completed ${completedLastWeek} tasks last week — that's above the 2-task weekly average for new hires.`
  }
  if (overallCompletionPct != null && overallCompletionPct - 65 >= 15) {
    return `Your overall task completion (${overallCompletionPct}%) is above the 65% average — you're in the top tier.`
  }
  if (lastPulseScore != null && lastPulseScore >= 4) {
    return `Your last pulse score was ${lastPulseScore}/5 — great morale correlates with 30% higher 90-day retention.`
  }

  // Priority 5 — day-based milestone context
  if (dayNumber >= 28 && dayNumber <= 32) return 'Your 30-day milestone is here — hires who complete their goals at day 30 ramp 40% faster.'
  if (dayNumber >= 58 && dayNumber <= 62) return 'At 60 days, the most successful hires have 1+ completed goals. Check your Goals tab.'
  if (dayNumber >= 7 && dayNumber <= 14)  return 'Hires who complete week 2 with all tasks done are 2× more likely to stay past 6 months.'

  return null
}

function getBriefing(props: WelcomeBannerProps): { icon: string; text: React.ReactNode } {
  const { dayNumber, pendingTaskCount = 0, completedThisWeek = 0, totalThisWeek = 0, nextCheckInDate, managerName, focusTaskTitle } = props

  // Next check-in within 2 days — highest priority signal
  if (nextCheckInDate) {
    const daysUntil = Math.ceil((new Date(nextCheckInDate).getTime() - Date.now()) / 86400000)
    if (daysUntil >= 0 && daysUntil <= 2) {
      const label = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : 'in 2 days'
      return {
        icon: 'fa-solid fa-calendar-check',
        text: <>Your {managerName ? <strong style={{ color: '#fff' }}>{managerName}</strong> : 'manager'} check-in is <strong style={{ color: '#fff' }}>{label}</strong>. Review your progress and blockers before then.</>,
      }
    }
  }

  // On track this week
  if (totalThisWeek > 0 && completedThisWeek > 0) {
    const pct = Math.round((completedThisWeek / totalThisWeek) * 100)
    if (pct >= 80) {
      return {
        icon: 'fa-solid fa-fire',
        text: <>You&apos;ve completed <strong style={{ color: '#fff' }}>{completedThisWeek}/{totalThisWeek}</strong> tasks this week — you&apos;re ahead of schedule. Great momentum!</>,
      }
    }
    if (pct >= 40 && focusTaskTitle) {
      return {
        icon: 'fa-solid fa-bolt',
        text: <><strong style={{ color: '#fff' }}>{completedThisWeek}/{totalThisWeek}</strong> tasks done. Next up: <strong style={{ color: '#fff' }}>&ldquo;{focusTaskTitle}&rdquo;</strong> — you&apos;re on track!</>,
      }
    }
    if (pct >= 40) {
      return {
        icon: 'fa-solid fa-bolt',
        text: <><strong style={{ color: '#fff' }}>{completedThisWeek}/{totalThisWeek}</strong> tasks done this week. <strong style={{ color: '#fff' }}>{totalThisWeek - completedThisWeek}</strong> remaining — you&apos;re on track!</>,
      }
    }
  }

  // Pending tasks nudge — show specific task name when available
  if (pendingTaskCount > 0 && focusTaskTitle) {
    return {
      icon: 'fa-solid fa-bullseye',
      text: <>Your top priority right now: <strong style={{ color: '#fff' }}>&ldquo;{focusTaskTitle}&rdquo;</strong>. Complete it to keep your week on track.</>,
    }
  }
  if (pendingTaskCount > 0) {
    return {
      icon: 'fa-solid fa-list-check',
      text: <>You have <strong style={{ color: '#fff' }}>{pendingTaskCount}</strong> pending task{pendingTaskCount !== 1 ? 's' : ''} this week. Focus on your top priority to keep your momentum.</>,
    }
  }

  // Day-based milestones
  if (dayNumber === 1)  return { icon: 'fa-solid fa-star', text: <>Welcome to day one! Your first task is at the top — complete it to earn your first XP.</> }
  if (dayNumber === 7)  return { icon: 'fa-solid fa-trophy', text: <>One week in — you&apos;re officially part of the team. Your 7-day check-in is coming up soon.</> }
  if (dayNumber === 30) return { icon: 'fa-solid fa-cake-candles', text: <>30 days in! This is a milestone worth celebrating. You&apos;ve built your foundation here.</> }
  if (dayNumber === 60) return { icon: 'fa-solid fa-chart-line', text: <>60 days! You&apos;re moving from learning to contributing. Your impact is growing every week.</> }
  if (dayNumber === 90) return { icon: 'fa-solid fa-medal', text: <>90 days completed! You&apos;ve finished your onboarding journey — you are now fully onboard.</> }

  return {
    icon: 'fa-solid fa-compass',
    text: <>Day <strong style={{ color: '#fff' }}>{dayNumber}</strong> of your onboarding journey. Keep building on the progress you&apos;ve made.</>,
  }
}

export default function WelcomeBanner({
  userName,
  dayNumber,
  avatarUrl,
  pendingTaskCount,
  completedThisWeek,
  totalThisWeek,
  nextCheckInDate,
  managerName,
  focusTaskTitle,
  overallCompletionPct,
  lastPulseScore,
  prevPulseScore,
  riskScore,
  cohortRankPct,
  completedLastWeek,
}: WelcomeBannerProps) {
  const { t } = useT()
  const briefing     = getBriefing({ userName, dayNumber, avatarUrl, pendingTaskCount, completedThisWeek, totalThisWeek, nextCheckInDate, managerName, focusTaskTitle })
  const dailyInsight = getDailyInsight({ userName, dayNumber, completedThisWeek, totalThisWeek, overallCompletionPct, lastPulseScore, prevPulseScore, cohortRankPct, completedLastWeek })
  const arc          = getJourneyArc(dayNumber, t)

  const weekPct = totalThisWeek && totalThisWeek > 0
    ? Math.round(((completedThisWeek ?? 0) / totalThisWeek) * 100)
    : null

  const urgency = riskScore != null && riskScore > 70 ? 'critical'
    : riskScore != null && riskScore > 50 ? 'elevated'
    : 'normal'

  const glowColor = urgency === 'critical'
    ? 'rgba(239,68,68,0.14)'
    : urgency === 'elevated'
      ? 'rgba(245,158,11,0.13)'
      : 'rgba(0,255,242,0.12)'

  return (
    <div className="wb glass-panel-pro" style={{ gap: 20, position: 'relative', overflow: 'hidden', alignItems: 'flex-start' }}>
      {/* Glow — color shifts with urgency */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at 70% 30%, ${glowColor}, transparent 70%)` }} />
      {/* Urgency alert strip */}
      {urgency !== 'normal' && (
        <div aria-label={urgency === 'critical' ? 'Journey at risk' : 'Journey needs attention'} style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: urgency === 'critical' ? 'var(--red)' : 'var(--amber)',
        }} />
      )}

      <div style={{ flex: 1, position: 'relative', zIndex: 1, minWidth: 0 }}>
        {/* Greeting row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <img
            src={avatarUrl || `https://i.pravatar.cc/80?u=${userName}`}
            alt={`${userName}'s avatar`}
            style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }}
          />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              {t('components.welcomeBanner.greeting')}, {userName}
            </h2>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>
              {t('components.welcomeBanner.dayOnboarding').replace('{day}', String(dayNumber))}
            </span>
          </div>
        </div>

        {/* Journey arc phase pill + narrative */}
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '2px 9px', borderRadius: 100,
              background: `color-mix(in srgb, ${arc.phaseColor} 18%, transparent)`,
              color: arc.phaseColor,
              border: `1px solid color-mix(in srgb, ${arc.phaseColor} 35%, transparent)`,
            }}>
              {arc.phase} {t('components.welcomeBanner.phase.phaseLabel')}
            </span>
            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${arc.phaseProgress}%`, background: arc.phaseColor, borderRadius: 100, transition: 'width 0.8s ease' }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{arc.phaseProgress}%</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            {arc.narrative}
          </p>
        </div>

        {/* Daily briefing */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: 'var(--r)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <i className={briefing.icon} style={{ fontSize: 14, color: 'var(--cyan)', marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55, margin: 0 }}>
            {briefing.text}
          </p>
        </div>

        {/* Week progress mini-bar */}
        {weekPct !== null && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 600 }}>
              <span>{t('components.welcomeBanner.weekProgress')}</span>
              <span>{completedThisWeek}/{totalThisWeek} {t('components.welcomeBanner.tasks')} · {weekPct}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${weekPct}%`, background: weekPct >= 80 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'var(--grad)', borderRadius: 100, transition: 'width 0.6s var(--ease)' }} />
            </div>
          </div>
        )}

        {/* Daily data-driven insight */}
        {dailyInsight && (
          <div style={{
            marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 7,
            padding: '8px 12px', borderRadius: 'var(--r)',
            background: 'rgba(0,200,224,0.1)', border: '1px solid rgba(0,200,224,0.2)',
          }}>
            <i className="fa-solid fa-chart-simple" style={{ fontSize: 10, color: 'var(--cyan)', marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5, margin: 0 }}>
              {dailyInsight}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
