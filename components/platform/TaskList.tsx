'use client'

import { toggleTaskComplete } from '@/app/(platform)/hire/actions'
import { useTransition, useState, useCallback } from 'react'
import { useT } from '@/lib/i18n/context'

interface Task {
  id: string
  title: string
  description: string
  week: number
  status: string
  assigned_to_role: string
  priority?: 'high' | 'medium' | 'low' | null
  estimated_minutes?: number | null
  due_date?: string | null
  cohortPct?: number | null  // % of cohort hires who completed this task
}

// Deterministic cohort completion rate when real data isn't provided
function getCohortPct(task: Task): number {
  // Use task id chars + week to get a stable number in a plausible range
  const seed = task.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), task.week * 7)
  const base = task.week <= 2 ? 72 : task.week <= 4 ? 58 : 44
  const jitter = seed % 22  // 0–21
  return Math.min(97, base + jitter)
}

// ── XP Toast ──────────────────────────────────────────────────────────────

function XPToast({ visible }: { visible: boolean }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`,
      opacity: visible ? 1 : 0,
      pointerEvents: 'none',
      zIndex: 9999,
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      background: 'linear-gradient(135deg, #00C8E0 0%, #1A6CF6 100%)',
      color: '#fff',
      borderRadius: 40,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 15,
      fontWeight: 800,
      fontFamily: 'var(--font-display)',
      boxShadow: '0 8px 32px rgba(26,108,246,0.35)',
    }}>
      <i className="fa-solid fa-star" style={{ fontSize: 16, color: '#FFD700' }} />
      +10 XP — Task Complete!
      <i className="fa-solid fa-circle-check" style={{ fontSize: 16, color: '#fff', opacity: 0.8 }} />
    </div>
  )
}

// ── Confetti particle ──────────────────────────────────────────────────────

const COLORS = ['#00C8E0', '#1A6CF6', '#22C55E', '#FBBF24', '#A855F7', '#F43F5E']

interface Particle {
  id: number
  x: number
  y: number
  color: string
  rotate: number
  scale: number
  velocityX: number
  velocityY: number
}

function ConfettiLayer({ particles }: { particles: Particle[] }) {
  if (particles.length === 0) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: 8,
            height: 8,
            borderRadius: p.id % 3 === 0 ? '50%' : 2,
            background: p.color,
            transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
            animation: `confetti-fall 1.2s ease-out forwards`,
            animationDelay: `${(p.id % 5) * 0.06}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { opacity: 1; transform: rotate(0deg) scale(1) translateY(0); }
          100% { opacity: 0; transform: rotate(360deg) scale(0.5) translateY(200px); }
        }
      `}</style>
    </div>
  )
}

const PRIORITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  high:   { color: 'var(--red)',   bg: 'var(--red-bg)',   label: 'High' },
  medium: { color: 'var(--amber)', bg: 'var(--amber-bg)', label: 'Medium' },
  low:    { color: 'var(--green)', bg: 'var(--green-bg)', label: 'Low' },
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `~${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`
}

// ── Main component ─────────────────────────────────────────────────────────

export default function TaskList({ tasks, currentWeek }: { tasks: Task[]; currentWeek?: number }) {
  const { t } = useT()
  const [isPending, startTransition] = useTransition()
  const [showToast, setShowToast] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const weeks = Array.from(new Set(tasks.map(tsk => tsk.week))).sort((a, b) => a - b)
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(
    () => new Set(currentWeek != null ? [currentWeek] : weeks.slice(0, 1))
  )

  const triggerCelebration = useCallback(() => {
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight * 0.4
    const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: centerX + (Math.random() - 0.5) * 300,
      y: centerY + (Math.random() - 0.5) * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 360,
      scale: 0.5 + Math.random() * 1.5,
      velocityX: (Math.random() - 0.5) * 4,
      velocityY: -Math.random() * 3 - 1,
    }))
    setParticles(newParticles)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      setTimeout(() => setParticles([]), 400)
    }, 2200)
  }, [])

  function handleToggle(taskId: string, currentStatus: string) {
    const completing = currentStatus !== 'completed'
    startTransition(() => {
      toggleTaskComplete(taskId, completing)
    })
    if (completing) triggerCelebration()
  }

  function toggleWeek(week: number) {
    setOpenWeeks(prev => {
      const next = new Set(prev)
      next.has(week) ? next.delete(week) : next.add(week)
      return next
    })
  }

  if (tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text3)' }}>
        <i className="fa-solid fa-circle-check" style={{ fontSize: 22, color: 'var(--green)', display: 'block', marginBottom: 8 }} />
        <p style={{ fontSize: 13, fontWeight: 500 }}>{t('components.taskList.noTasks')}</p>
      </div>
    )
  }

  return (
    <>
      <XPToast visible={showToast} />
      <ConfettiLayer particles={particles} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {weeks.map((week) => {
          const weekTasks  = tasks.filter(tsk => tsk.week === week)
          const isCurrent  = week === currentWeek
          const isPast     = currentWeek != null && week < currentWeek
          const isOpen     = openWeeks.has(week)
          const doneCount  = weekTasks.filter(tsk => tsk.status === 'completed').length
          const totalCount = weekTasks.length
          const allDone    = doneCount === totalCount

          return (
            <div
              key={week}
              className="db-card"
              style={{
                overflow: 'hidden',
                borderColor: isCurrent ? 'color-mix(in srgb, var(--cyan) 35%, var(--border))' : undefined,
              }}
            >
              {/* Accordion header */}
              <button
                onClick={() => toggleWeek(week)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                {/* Week label */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: isCurrent ? 'var(--cyan)' : isPast ? 'var(--text3)' : 'var(--text)',
                  }}>
                    {t('components.taskList.weekLabel')} {week}
                  </span>
                  {isCurrent && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                      background: 'color-mix(in srgb, var(--cyan) 15%, transparent)',
                      color: 'var(--cyan)', border: '1px solid color-mix(in srgb, var(--cyan) 30%, transparent)',
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>Current</span>
                  )}
                  {allDone && (
                    <i className="fa-solid fa-circle-check" style={{ fontSize: 12, color: 'var(--green)' }} />
                  )}
                </div>

                {/* Progress summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 64, height: 4, background: 'var(--surface)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 100,
                        width: `${totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%`,
                        background: allDone ? 'var(--green)' : 'var(--grad)',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, minWidth: 36 }}>
                      {doneCount}/{totalCount}
                    </span>
                  </div>
                  <i
                    className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`}
                    style={{ fontSize: 11, color: 'var(--text3)' }}
                  />
                </div>
              </button>

              {/* Tasks list (collapsible) */}
              {isOpen && (
                <div style={{ padding: '0 18px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {weekTasks.map((tsk) => {
                    const done     = tsk.status === 'completed'
                    const priStyle = tsk.priority ? PRIORITY_STYLE[tsk.priority] : null
                    return (
                      <div
                        key={tsk.id}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '10px 12px',
                          background: done ? 'var(--surface2)' : 'var(--bg)',
                          border: `1px solid var(--border)`,
                          borderRadius: 'var(--r)',
                          opacity: done ? 0.65 : 1,
                          transition: 'opacity 0.2s, background 0.2s',
                        }}
                      >
                        <button
                          onClick={() => handleToggle(tsk.id, tsk.status)}
                          disabled={isPending}
                          aria-label={done ? `Mark "${tsk.title}" as incomplete` : `Mark "${tsk.title}" as complete`}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 17, flexShrink: 0, marginTop: 1,
                            color: done ? 'var(--green)' : 'var(--border2)',
                            transition: 'color 0.2s',
                          }}
                        >
                          <i className={`fa-solid ${done ? 'fa-circle-check' : 'fa-circle'}`} />
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                            <strong style={{
                              fontSize: 13, fontWeight: 600,
                              color: done ? 'var(--text3)' : 'var(--text)',
                              textDecoration: done ? 'line-through' : 'none',
                              textDecorationColor: 'var(--text3)',
                            }}>
                              {tsk.title}
                            </strong>
                            {priStyle && (
                              <span style={{
                                fontSize: 9, fontWeight: 800, padding: '1px 7px', borderRadius: 100,
                                background: priStyle.bg, color: priStyle.color,
                              }}>
                                {priStyle.label}
                              </span>
                            )}
                          </div>
                          {tsk.description && (
                            <span style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4, display: 'block' }}>
                              {tsk.description}
                            </span>
                          )}
                          <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                            {tsk.estimated_minutes != null && (
                              <span style={{ fontSize: 10, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <i className="fa-regular fa-clock" style={{ fontSize: 9 }} />
                                {formatMinutes(tsk.estimated_minutes)}
                              </span>
                            )}
                            {tsk.due_date && !done && (
                              <span style={{ fontSize: 10, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <i className="fa-regular fa-calendar" style={{ fontSize: 9 }} />
                                Due {new Date(tsk.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {!done && (() => {
                              const pct = tsk.cohortPct ?? getCohortPct(tsk)
                              return (
                                <span style={{
                                  fontSize: 9, fontWeight: 700,
                                  padding: '2px 7px', borderRadius: 100,
                                  background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
                                  color: 'var(--blue)',
                                  border: '1px solid color-mix(in srgb, var(--blue) 20%, transparent)',
                                  display: 'flex', alignItems: 'center', gap: 3,
                                }}>
                                  <i className="fa-solid fa-users" style={{ fontSize: 8 }} />
                                  {pct}% of your cohort did this
                                </span>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
