'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toggleTaskComplete } from '@/app/(platform)/hire/actions'

interface Task {
  id: string
  title: string
  description: string
  week: number
  status: string
  assigned_to_role?: string
  due_date?: string | null
  completed_at?: string | null
}

interface TodayFocusProps {
  tasks: Task[]
  currentWeek: number
  dayNumber: number
  recommendedResource?: { title: string; url?: string }
  goals?: { milestone: string; title: string; status: string }[]
}

// Micro confetti particle
function ConfettiLayer() {
  const COLORS = ['#00c8e0', '#1a6cf6', '#22c55e', '#f59e0b', '#a78bfa', '#fff']
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id:    i,
    color: COLORS[i % COLORS.length],
    left:  10 + Math.random() * 80,
    delay: Math.random() * 0.5,
    size:  5 + Math.random() * 5,
    dur:   0.7 + Math.random() * 0.6,
  }))

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      <style>{`
        @keyframes tf-confetti {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110px) rotate(540deg); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? '50%' : 2,
            background: p.color,
            animation: `tf-confetti ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

// +XP toast
function XPToast() {
  return (
    <div style={{
      position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #1a6cf6, #00c8e0)',
      color: '#fff', fontSize: 12, fontWeight: 800,
      padding: '6px 14px', borderRadius: 99,
      boxShadow: '0 4px 16px rgba(0,200,224,0.4)',
      zIndex: 20, whiteSpace: 'nowrap',
      animation: 'tf-xp 1.8s ease forwards',
    }}>
      <style>{`
        @keyframes tf-xp {
          0%   { opacity: 0; transform: translateX(-50%) translateY(10px); }
          20%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          70%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-16px); }
        }
      `}</style>
      <i className="fa-solid fa-bolt-lightning" style={{ marginRight: 5 }} />
      +10 XP — Task Complete!
    </div>
  )
}

export default function TodayFocus({ tasks, currentWeek, dayNumber, recommendedResource, goals }: TodayFocusProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [doneId, setDoneId]   = useState<string | null>(null)
  const [showXP, setShowXP]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [localDone, setLocalDone] = useState<Set<string>>(new Set())

  const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

  // Only show tasks assigned to the hire (not manager/HR tasks)
  const hireTasks = tasks.filter(t => !t.assigned_to_role || t.assigned_to_role === 'new_hire')
  const weekTasks = hireTasks.filter(t => t.week === currentWeek)
  const completedCount = weekTasks.filter(t => t.status === 'completed' || localDone.has(t.id)).length
  const totalCount   = weekTasks.length

  // Pick the highest-priority pending task: sort by priority then due_date
  const pendingThisWeek = hireTasks
    .filter(t => t.week === currentWeek && (t.status === 'in_progress' || t.status === 'pending') && !localDone.has(t.id))
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[(a as any).priority ?? 'low'] ?? 2
      const pb = PRIORITY_ORDER[(b as any).priority ?? 'low'] ?? 2
      if (pa !== pb) return pa - pb
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })

  const focusTask =
    pendingThisWeek[0] ??
    hireTasks.find(t => t.week === currentWeek + 1 && (t.status === 'in_progress' || t.status === 'pending') && !localDone.has(t.id)) ??
    null

  const allDone = completedCount === totalCount && totalCount > 0

  const progressPct = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0

  const handleMarkDone = useCallback(() => {
    if (!focusTask || isPending) return
    setError(null)
    const id = focusTask.id

    // Optimistic update
    setLocalDone(prev => new Set(prev).add(id))
    setDoneId(id)
    setShowXP(true)
    setTimeout(() => { setDoneId(null); setShowXP(false) }, 1900)

    startTransition(async () => {
      try {
        await toggleTaskComplete(id, true)
        window.dispatchEvent(new CustomEvent('aura-task-completed', { detail: { taskTitle: focusTask.title } }))
        router.refresh()
      } catch {
        // Rollback optimistic update
        setLocalDone(prev => { const next = new Set(prev); next.delete(id); return next })
        setError('Could not save — please try again.')
      }
    })
  }, [focusTask, isPending, router])

  return (
    <div
      style={{
        background: 'var(--grad-main, linear-gradient(135deg, #0A0F1E 0%, #0D1D3E 100%))',
        borderRadius: 'var(--r-xl)',
        padding: '28px 32px',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        boxShadow: '0 16px 56px rgba(13,21,41,0.22)',
      }}
    >
      {/* Confetti */}
      {doneId && <ConfettiLayer />}
      {showXP  && <XPToast />}

      {/* Glow top-right */}
      <div aria-hidden style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,224,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
      {/* Glow bottom-left */}
      <div aria-hidden style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,108,246,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-bullseye" style={{ fontSize: 15, color: 'var(--cyan)' }} aria-hidden />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cyan)', fontFamily: 'var(--font-display)' }}>
            Today&apos;s Focus
          </span>
        </div>
        <div style={{ background: 'rgba(0,200,224,0.15)', border: '1px solid rgba(0,200,224,0.35)', borderRadius: 'var(--r)', padding: '4px 12px', fontSize: 12, fontWeight: 700, color: 'var(--cyan)', fontFamily: 'var(--font-display)' }}>
          Day {dayNumber}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 'var(--r)', fontSize: 12, color: '#fca5a5', position: 'relative', zIndex: 1 }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
          {error}
        </div>
      )}

      {/* Content */}
      {allDone ? (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(0,200,224,0.2))', border: '2px solid rgba(34,197,94,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fa-solid fa-sparkles" style={{ fontSize: 22, color: '#4ade80' }} aria-hidden />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
              All tasks for Week {currentWeek} complete! 🎉
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
              You&apos;re ahead of the game. Check back next week for new tasks.
            </p>
          </div>
        </div>
      ) : focusTask ? (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-lg)', padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--r)',
                background: doneId === focusTask.id ? 'linear-gradient(135deg, #22c55e, #16a34a)' : isPending ? 'rgba(255,255,255,0.2)' : 'var(--grad)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'background 0.3s ease',
              }}>
                <i className={doneId === focusTask.id ? 'fa-solid fa-circle-check' : isPending ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-right'} style={{ fontSize: 16, color: '#fff' }} aria-hidden />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 6, lineHeight: 1.3 }}>
                  {focusTask.title}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', lineHeight: 1.5, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {focusTask.description}
                </p>
                {focusTask.due_date && (() => {
                  const dueMs = new Date(focusTask.due_date).getTime()
                  const daysLeft = Math.ceil((dueMs - Date.now()) / 86400000)
                  const urgent = daysLeft <= 1
                  return (
                    <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: urgent ? '#fca5a5' : 'rgba(255,255,255,0.5)', background: urgent ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.08)', borderRadius: 100, padding: '3px 10px', border: `1px solid ${urgent ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)'}` }}>
                      <i className="fa-regular fa-calendar" style={{ fontSize: 9 }} />
                      Due {daysLeft <= 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : new Date(focusTask.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )
                })()}
                {(() => {
                  if (!goals?.length) return null
                  const milestone = dayNumber <= 30 ? 'day_30' : dayNumber <= 60 ? 'day_60' : 'day_90'
                  const activeGoal = goals.find(g => g.milestone === milestone && g.status !== 'completed')
                  if (!activeGoal) return null
                  return (
                    <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'rgba(168,139,250,0.9)', background: 'rgba(168,139,250,0.12)', borderRadius: 100, padding: '3px 10px', border: '1px solid rgba(168,139,250,0.25)', maxWidth: '100%', overflow: 'hidden' }}>
                      <i className="fa-solid fa-flag" style={{ fontSize: 9, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        Toward: {activeGoal.title}
                      </span>
                    </div>
                  )
                })()}
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              {doneId === focusTask.id ? (
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 14 }} aria-hidden />
                  Marked as done!
                </span>
              ) : (
                <button
                  onClick={handleMarkDone}
                  disabled={isPending}
                  style={{
                    background: isPending ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    borderRadius: 'var(--r)', color: '#fff', fontSize: 13, fontWeight: 700,
                    padding: '8px 18px', cursor: isPending ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontFamily: 'var(--font-display)', transition: 'background 0.2s ease',
                    opacity: isPending ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (!isPending) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={e => { if (!isPending) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)' }}
                >
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 13 }} aria-hidden />
                  {isPending ? 'Saving…' : 'Mark as done'}
                </button>
              )}
            </div>
          </div>

          <ProgressBar completedCount={completedCount} totalCount={totalCount} progressPct={progressPct} currentWeek={currentWeek} />

          {recommendedResource && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
              <i className="fa-solid fa-book-open" style={{ fontSize: 12, color: 'var(--cyan)', flexShrink: 0 }} aria-hidden />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Recommended for Week {currentWeek}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{recommendedResource.title}</div>
              </div>
              {recommendedResource.url && (
                <a href={recommendedResource.url} style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', textDecoration: 'none', flexShrink: 0 }}>
                  Read <i className="fa-solid fa-arrow-right" style={{ fontSize: 9 }} />
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1, fontSize: 15, color: 'rgba(255,255,255,0.70)', padding: '8px 0' }}>
          No pending tasks found. Check back soon!
        </div>
      )}
    </div>
  )
}

function ProgressBar({ completedCount, totalCount, progressPct, currentWeek }: { completedCount: number; totalCount: number; progressPct: number; currentWeek: number }) {
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
          {completedCount} of {totalCount} tasks complete this week
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: progressPct >= 80 ? '#4ade80' : 'var(--cyan)', fontFamily: 'var(--font-display)' }}>
          Week {currentWeek} · {progressPct}%
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progressPct}%`, borderRadius: 99, background: progressPct >= 80 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'var(--grad)', transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
    </div>
  )
}
