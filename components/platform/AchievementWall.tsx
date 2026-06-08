'use client'

import { useState, useEffect, useTransition } from 'react'
import { shareAchievement, unlockAchievement } from '@/app/(platform)/hire/actions'

interface Task {
  id: string
  title: string
  week: number
  status: string
  completed_at?: string | null
}

interface CheckIn {
  completed_date?: string | null
  type?: string
}

interface AchievementWallProps {
  tasks?: Task[]
  dayNumber?: number
  checkIns?: CheckIn[]
  journeyId?: string
  pulseChecks?: { week: number; score: number }[]
  seenAchievements?: string[]
}

const KEYFRAMES = `
@keyframes achievePop {
  0%   { transform: scale(0);   opacity: 0; }
  60%  { transform: scale(1.2);             }
  100% { transform: scale(1);   opacity: 1; }
}
`

function UnlockToast({ label, icon, visible }: { label: string; icon: string; visible: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
      opacity: visible ? 1 : 0, pointerEvents: 'none',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      zIndex: 9999,
      background: 'linear-gradient(135deg, #1A6CF6 0%, #00C8E0 100%)',
      color: '#fff', borderRadius: 40, padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13, fontWeight: 800,
      boxShadow: '0 8px 32px rgba(26,108,246,0.4)',
    }}>
      <i className={icon} style={{ fontSize: 15, color: '#FFD700' }} />
      Achievement Unlocked: {label}
    </div>
  )
}

export default function AchievementWall({ tasks = [], dayNumber = 1, checkIns = [], journeyId, pulseChecks = [], seenAchievements = [] }: AchievementWallProps) {
  const [newIds, setNewIds]     = useState<Set<string>>(new Set())
  const [shared, setShared]     = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [toast, setToast]       = useState<{ label: string; icon: string } | null>(null)

  const completed      = tasks.filter(t => t.status === 'completed')
  const completedCount = completed.length
  const week1Tasks     = tasks.filter(t => t.week === 1)
  const week1Done      = week1Tasks.length > 0 && week1Tasks.every(t => t.status === 'completed')
  const task10Done     = completedCount >= 10
  const task20Done     = completedCount >= 20
  const task25Done     = completedCount >= 25
  const task50Done     = completedCount >= 50
  const task100Done    = completedCount >= 100

  // Pulse streak: 3+ consecutive weeks with a submitted check
  const pulseWeeks     = pulseChecks.map(p => p.week).sort((a, b) => a - b)
  const maxPulseStreak = pulseWeeks.reduce((streak, week, i) => {
    const run = i === 0 || pulseWeeks[i - 1] !== week - 1 ? 1 : streak + 1
    return Math.max(streak, run)
  }, 0)
  const pulseStreakDone = maxPulseStreak >= 3
  // "Paperwork Pro": any task completed in weeks 1-2 that sounds administrative.
  // Primary signal: status === 'completed'. String hints are a secondary tiebreak,
  // but we also credit any week-1 or week-2 task completion as proof of early engagement.
  const ADMIN_KEYWORDS = ['form', 'enroll', 'benefit', 'paperwork', 'submit', 'sign', 'document', 'policy', 'agreement', 'contract', 'handbook']
const CHECK_IN_TYPES = new Set(['day_7', 'weekly', 'day_30', 'day30', 'monthly', 'buddy', 'manager'])
  const formDone = tasks.some(t =>
    t.status === 'completed' && (
      ADMIN_KEYWORDS.some(kw => t.title.toLowerCase().includes(kw)) ||
      t.week <= 2
    )
  )
  const month1Done      = dayNumber >= 30
  const halfwayDone     = dayNumber >= 45
  const completedCIs    = checkIns.filter(c => !!c.completed_date)
  const teamPlayerDone  = completedCIs.length >= 5
  const uniqueCITypes   = new Set(completedCIs.map(c => c.type ?? 'unknown'))
  const collaboratorDone = uniqueCITypes.size >= 3
  const day7CIDone      = completedCIs.some(c => CHECK_IN_TYPES.has(c.type ?? ''))
  const milestone30Done = completedCIs.some(c => c.type === 'day_30' || c.type === 'day30')

  // Early bird: all week-1 tasks done within first 7 days
  const earlyBirdDone = week1Done && dayNumber <= 7

  const earnedMap: Record<string, boolean> = {
    week1:        week1Done,
    early_bird:   earlyBirdDone,
    task10:       task10Done,
    task20:       task20Done,
    task25:       task25Done,
    task50:       task50Done,
    task100:      task100Done,
    pulse_streak: pulseStreakDone,
    form:         formDone,
    day7:         day7CIDone,
    month1:       month1Done,
    milestone30:  milestone30Done,
    halfway:      halfwayDone,
    social:       teamPlayerDone,
    collab:       collaboratorDone,
  }

  useEffect(() => {
    const ACHIEVEMENTS_DEF = [
      { id: 'week1',        icon: 'fa-solid fa-seedling',          label: 'First Week'    },
      { id: 'early_bird',   icon: 'fa-solid fa-dove',              label: 'Early Bird'    },
      { id: 'task10',       icon: 'fa-solid fa-list-check',        label: 'Task Master'   },
      { id: 'task20',       icon: 'fa-solid fa-medal',             label: 'Overachiever'  },
      { id: 'task25',       icon: 'fa-solid fa-fire',              label: 'On Fire'       },
      { id: 'task50',       icon: 'fa-solid fa-bolt',              label: 'Half Century'  },
      { id: 'task100',      icon: 'fa-solid fa-crown',             label: 'Century Club'  },
      { id: 'pulse_streak', icon: 'fa-solid fa-heart-pulse',       label: 'Pulse Keeper'  },
      { id: 'form',         icon: 'fa-solid fa-file-circle-check', label: 'Paperwork Pro' },
      { id: 'day7',         icon: 'fa-solid fa-calendar-day',      label: 'Week 1 Review' },
      { id: 'month1',       icon: 'fa-solid fa-calendar-check',    label: 'Month One'     },
      { id: 'milestone30',  icon: 'fa-solid fa-star',              label: '30-Day Review' },
      { id: 'halfway',      icon: 'fa-solid fa-road',              label: 'Halfway There' },
      { id: 'social',       icon: 'fa-solid fa-handshake',         label: 'Team Player'   },
      { id: 'collab',       icon: 'fa-solid fa-people-arrows',     label: 'Collaborator'  },
    ]
    const seen      = new Set<string>(seenAchievements)
    const earnedIds = Object.entries(earnedMap).filter(([, v]) => v).map(([k]) => k)
    const fresh     = new Set(earnedIds.filter(id => !seen.has(id)))
    if (fresh.size > 0) {
      setNewIds(fresh)
      // Persist each newly unlocked achievement to DB
      if (journeyId) {
        for (const id of fresh) {
          const def = ACHIEVEMENTS_DEF.find(a => a.id === id)
          if (def) void unlockAchievement(journeyId, id, def.label)
        }
      }
      // Show toast for the first newly unlocked achievement
      const firstId = [...fresh][0]
      const def = ACHIEVEMENTS_DEF.find(a => a.id === firstId)
      if (def) {
        setToast({ label: def.label, icon: def.icon })
        setTimeout(() => setToast(null), 3000)
      }
      const t = setTimeout(() => setNewIds(new Set()), 5000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedCount, week1Done, task10Done, task20Done, task25Done, task50Done, task100Done, pulseStreakDone, formDone, month1Done, halfwayDone, teamPlayerDone, collaboratorDone, day7CIDone, milestone30Done, earlyBirdDone])

  const xpRaw     = completedCount * 50
  const level     = xpRaw >= 1000 ? 3 : xpRaw >= 500 ? 2 : 1
  const xpBase    = level === 3 ? 1000 : level === 2 ? 500 : 0
  const xpCap     = level === 3 ? 1500 : level === 2 ? 1000 : 500
  const xpCurrent = Math.min(xpRaw - xpBase, xpCap - xpBase)
  const xpTotal   = xpCap - xpBase
  const xpPct     = Math.round((xpCurrent / xpTotal) * 100)

  const ACHIEVEMENTS = [
    { id: 'week1',        icon: 'fa-solid fa-seedling',          label: 'First Week',     desc: 'Complete all week 1 tasks',              earned: week1Done,        color: '#22C55E' },
    { id: 'early_bird',   icon: 'fa-solid fa-dove',              label: 'Early Bird',     desc: 'Finish week 1 within your first 7 days', earned: earlyBirdDone,    color: '#F59E0B' },
    { id: 'task10',       icon: 'fa-solid fa-list-check',        label: 'Task Master',    desc: 'Complete 10 tasks',                      earned: task10Done,       color: '#F59E0B' },
    { id: 'task20',       icon: 'fa-solid fa-medal',             label: 'Overachiever',   desc: 'Complete 20 tasks',                      earned: task20Done,       color: '#EF4444' },
    { id: 'task25',       icon: 'fa-solid fa-fire',              label: 'On Fire',        desc: 'Complete 25 tasks',                      earned: task25Done,       color: '#F97316' },
    { id: 'task50',       icon: 'fa-solid fa-bolt',              label: 'Half Century',   desc: 'Complete 50 tasks',                      earned: task50Done,       color: '#A855F7' },
    { id: 'task100',      icon: 'fa-solid fa-crown',             label: 'Century Club',   desc: 'Complete 100 tasks',                     earned: task100Done,      color: '#EAB308' },
    { id: 'pulse_streak', icon: 'fa-solid fa-heart-pulse',       label: 'Pulse Keeper',   desc: 'Submit pulse checks 3 weeks in a row',   earned: pulseStreakDone,  color: '#EC4899' },
    { id: 'form',         icon: 'fa-solid fa-file-circle-check', label: 'Paperwork Pro',  desc: 'Submit all required forms',              earned: formDone,         color: '#8B5CF6' },
    { id: 'day7',         icon: 'fa-solid fa-calendar-day',      label: 'Week 1 Review',  desc: 'Complete your 7-day check-in',           earned: day7CIDone,       color: '#00C8E0' },
    { id: 'month1',       icon: 'fa-solid fa-calendar-check',    label: 'Month One',      desc: 'Reach 30 days on the job',               earned: month1Done,       color: '#00C8E0' },
    { id: 'milestone30',  icon: 'fa-solid fa-star',              label: '30-Day Review',  desc: 'Complete your 30-day check-in',          earned: milestone30Done,  color: '#F59E0B' },
    { id: 'halfway',      icon: 'fa-solid fa-road',              label: 'Halfway There',  desc: 'Reach day 45 of your journey',           earned: halfwayDone,      color: '#1A6CF6' },
    { id: 'social',       icon: 'fa-solid fa-handshake',         label: 'Team Player',    desc: 'Complete 5+ check-ins',                  earned: teamPlayerDone,   color: '#1A6CF6' },
    { id: 'collab',       icon: 'fa-solid fa-people-arrows',     label: 'Collaborator',   desc: 'Attend 3 different meeting types',       earned: collaboratorDone, color: '#EC4899' },
  ]

  const earnedAchievements = ACHIEVEMENTS.filter(a => a.earned)
  const nextAchievement    = ACHIEVEMENTS.find(a => !a.earned)

  let nextProgressPct = 0
  let nextRemaining   = ''
  if (nextAchievement) {
    if (nextAchievement.id === 'week1' || nextAchievement.id === 'early_bird') {
      const done = week1Tasks.filter(t => t.status === 'completed').length
      nextProgressPct = week1Tasks.length > 0 ? Math.round((done / week1Tasks.length) * 100) : 0
      nextRemaining   = `${week1Tasks.length - done} tasks remaining`
    } else if (nextAchievement.id === 'task10') {
      nextProgressPct = Math.min(100, Math.round((completedCount / 10) * 100))
      nextRemaining   = `${Math.max(0, 10 - completedCount)} tasks remaining`
    } else if (nextAchievement.id === 'task20') {
      nextProgressPct = Math.min(100, Math.round((completedCount / 20) * 100))
      nextRemaining   = `${Math.max(0, 20 - completedCount)} tasks remaining`
    } else if (nextAchievement.id === 'task25') {
      nextProgressPct = Math.min(100, Math.round((completedCount / 25) * 100))
      nextRemaining   = `${Math.max(0, 25 - completedCount)} tasks remaining`
    } else if (nextAchievement.id === 'task50') {
      nextProgressPct = Math.min(100, Math.round((completedCount / 50) * 100))
      nextRemaining   = `${Math.max(0, 50 - completedCount)} tasks remaining`
    } else if (nextAchievement.id === 'task100') {
      nextProgressPct = Math.min(100, Math.round((completedCount / 100) * 100))
      nextRemaining   = `${Math.max(0, 100 - completedCount)} tasks remaining`
    } else if (nextAchievement.id === 'pulse_streak') {
      nextProgressPct = Math.min(100, Math.round((maxPulseStreak / 3) * 100))
      nextRemaining   = `${Math.max(0, 3 - maxPulseStreak)} more consecutive weeks`
    } else if (nextAchievement.id === 'form') {
      nextProgressPct = formDone ? 100 : 0
      nextRemaining   = 'Submit a form to unlock'
    } else if (nextAchievement.id === 'month1') {
      nextProgressPct = Math.min(100, Math.round((dayNumber / 30) * 100))
      nextRemaining   = `${Math.max(0, 30 - dayNumber)} days remaining`
    } else if (nextAchievement.id === 'halfway') {
      nextProgressPct = Math.min(100, Math.round((dayNumber / 45) * 100))
      nextRemaining   = `${Math.max(0, 45 - dayNumber)} days remaining`
    } else if (nextAchievement.id === 'social') {
      nextProgressPct = Math.min(100, Math.round((completedCIs.length / 5) * 100))
      nextRemaining   = `${Math.max(0, 5 - completedCIs.length)} check-ins remaining`
    } else if (nextAchievement.id === 'collab') {
      nextProgressPct = Math.min(100, Math.round((uniqueCITypes.size / 3) * 100))
      nextRemaining   = `${Math.max(0, 3 - uniqueCITypes.size)} meeting types remaining`
    }
  }

  function handleShare(achievement: typeof ACHIEVEMENTS[number]) {
    if (!journeyId || shared.has(achievement.id)) return
    setShared(s => new Set([...s, achievement.id]))
    startTransition(() => shareAchievement(journeyId, achievement.label))
  }

  return (
    <div className="db-card">
      <style>{KEYFRAMES}</style>
      <UnlockToast label={toast?.label ?? ''} icon={toast?.icon ?? ''} visible={!!toast} />

      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-trophy" style={{ color: 'var(--amber)' }} />
          Achievement Board
        </h3>
        <span className="badge-ai">Level {level}</span>
      </div>

      <div className="db-card-bd">
        {/* XP progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
            <span style={{ color: 'var(--text2)' }}>Progress to Level {level + 1}</span>
            <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>
              {xpCurrent} <span style={{ fontWeight: 400 }}>/ {xpTotal} XP</span>
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ width: `${xpPct}%`, height: '100%', background: 'var(--grad)', borderRadius: 100, transition: 'width 0.6s var(--ease)' }} />
          </div>
        </div>

        {/* Achievement grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {ACHIEVEMENTS.map(a => {
            const isNew = newIds.has(a.id)
            return (
              <div key={a.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingBottom: 4, justifyContent: 'flex-start', paddingTop: 8 }}>
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: a.earned ? `color-mix(in srgb, ${a.color} 18%, transparent)` : 'var(--surface2)',
                    border: `1.5px solid ${a.earned ? a.color : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: a.earned ? a.color : 'var(--text3)', fontSize: 15,
                    opacity: a.earned ? 1 : 0.35,
                    animation: isNew ? 'achievePop 0.5s ease-out forwards' : undefined,
                  }}>
                    <i className={a.icon} aria-hidden="true" />
                  </div>
                  {isNew && (
                    <span style={{
                      position: 'absolute', top: -4, right: -6,
                      background: '#EF4444', color: '#fff', fontSize: 8,
                      fontWeight: 800, lineHeight: 1, padding: '2px 4px',
                      borderRadius: 20, letterSpacing: '0.02em', pointerEvents: 'none',
                    }}>NEW!</span>
                  )}
                  {!a.earned && (
                    <i className="fa-solid fa-lock" aria-hidden="true" style={{
                      position: 'absolute', bottom: -2, right: -4,
                      fontSize: 10, color: 'var(--text3)', pointerEvents: 'none',
                    }} />
                  )}
                </div>

                <span style={{ fontSize: 10, textAlign: 'center', fontWeight: 700, color: a.earned ? 'var(--text2)' : 'var(--text3)', lineHeight: 1.3 }}>
                  {a.label}
                </span>

                {a.earned ? (
                  <span style={{ fontSize: 9, color: '#22C55E', fontWeight: 700 }}>✓ Earned</span>
                ) : (
                  <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500, textAlign: 'center', lineHeight: 1.2, maxWidth: 72 }}>
                    {a.desc}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Share earned achievements with manager */}
        {earnedAchievements.length > 0 && journeyId && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>
              Share a win with your manager
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {earnedAchievements.map(a => {
                const wasShared = shared.has(a.id)
                return (
                  <button
                    key={a.id}
                    onClick={() => handleShare(a)}
                    disabled={isPending || wasShared}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 10, fontWeight: 700, padding: '4px 10px',
                      borderRadius: 100, cursor: wasShared ? 'default' : 'pointer',
                      background: wasShared ? 'rgba(34,197,94,0.1)' : 'var(--surface)',
                      border: `1px solid ${wasShared ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                      color: wasShared ? 'var(--green)' : 'var(--text2)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <i className={wasShared ? 'fa-solid fa-check' : 'fa-solid fa-share-nodes'} style={{ fontSize: 9 }} />
                    {wasShared ? 'Shared!' : a.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Next milestone */}
        {nextAchievement && (
          <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>
              <span>🎯</span>
              <span>Next: &ldquo;{nextAchievement.label}&rdquo; — {nextAchievement.desc}</span>
            </div>
            <div className="pw" style={{ marginBottom: 6 }}>
              <div className="pf" style={{ width: `${nextProgressPct}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>
              <span>{nextProgressPct}%</span>
              <span>{nextRemaining}</span>
            </div>
          </div>
        )}

        {!nextAchievement && (
          <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#22C55E', fontWeight: 700 }}>
            🎉 All achievements unlocked!
          </div>
        )}
      </div>
    </div>
  )
}
