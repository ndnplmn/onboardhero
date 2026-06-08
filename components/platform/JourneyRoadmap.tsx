'use client'

import { useState, useTransition, useRef } from 'react'
import { acceptAISuggestion } from '@/app/(platform)/hire/actions'

interface Task {
  week: number
  status: string
}

interface Phase {
  label: string
  desc: string
  week: number
}

interface JourneyRoadmapProps {
  mutations?: any[]
  currentWeek?: number
  journeyId?: string
  tasks?: Task[]
}

const BASE_PHASES: Phase[] = [
  { label: 'Week 1',   desc: 'Orientation',       week: 1  },
  { label: 'Week 2',   desc: 'Team Setup',         week: 2  },
  { label: 'Week 3–4', desc: 'First Deliverables', week: 3  },
  { label: 'Month 2',  desc: 'Ramp-up',            week: 8  },
  { label: 'Month 3',  desc: 'Full Productivity',  week: 12 },
]

const PHASE_BUCKETS: { label: string; minWeek: number; maxWeek: number; week: number }[] = [
  { label: 'Week 1',   minWeek: 1,  maxWeek: 1,  week: 1  },
  { label: 'Week 2',   minWeek: 2,  maxWeek: 2,  week: 2  },
  { label: 'Week 3–4', minWeek: 3,  maxWeek: 4,  week: 3  },
  { label: 'Month 2',  minWeek: 5,  maxWeek: 8,  week: 8  },
  { label: 'Month 3',  minWeek: 9,  maxWeek: 12, week: 12 },
]

function buildPhasesFromTasks(tasks: Task[]): Phase[] {
  if (!tasks.length) return BASE_PHASES
  return PHASE_BUCKETS.map(bucket => {
    const bucketTasks  = tasks.filter(t => t.week >= bucket.minWeek && t.week <= bucket.maxWeek)
    const completed    = bucketTasks.filter(t => t.status === 'completed').length
    const total        = bucketTasks.length
    const desc         = total > 0 ? `${completed}/${total} tasks` : 'No tasks'
    return { label: bucket.label, desc, week: bucket.week }
  })
}

export default function JourneyRoadmap({ mutations = [], currentWeek = 3, journeyId, tasks }: JourneyRoadmapProps) {
  const [dismissed, setDismissed] = useState<number[]>([])
  const [accepted, setAccepted]   = useState<number[]>([])
  const [isPending, startTransition] = useTransition()
  const inFlight = useRef<Set<number>>(new Set())

  const phases = buildPhasesFromTasks(tasks ?? [])

  const totalWeeks = 12
  const progressPct = Math.min(100, Math.round((currentWeek / totalWeeks) * 100))

  const aiSuggestions = mutations
    .filter(m => m.type === 'ADD_TASK' && m.taskTitle)
    .map((m, i) => ({ idx: i, title: m.taskTitle, reason: m.reason as string | undefined }))

  const visible = aiSuggestions.filter(s => !dismissed.includes(s.idx) && !accepted.includes(s.idx))

  function handleAccept(s: { idx: number; title: string; reason?: string }) {
    if (!journeyId || inFlight.current.has(s.idx)) return
    inFlight.current.add(s.idx)
    setAccepted(a => [...a, s.idx])
    startTransition(() => {
      acceptAISuggestion(journeyId, s.title, s.reason ?? '')
        .finally(() => inFlight.current.delete(s.idx))
    })
  }

  function handleDismiss(idx: number) {
    setDismissed(d => [...d, idx])
  }

  return (
    <div className="db-card">
      {/* Header */}
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-map-pin" style={{ color: 'var(--blue)' }} />
          Onboarding Progress
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {visible.length > 0 && <span className="badge-ai">AI Updated</span>}
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18, fontWeight: 800,
            background: 'var(--grad)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {progressPct}%
          </span>
        </div>
      </div>

      <div style={{ padding: '24px' }}>

        {/* Progress bar */}
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 100, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: 'var(--grad)',
            borderRadius: 100, width: `${progressPct}%`,
            transition: 'width 0.6s var(--ease)',
          }} />
        </div>

        {/* Step track */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start' }}>
          <div style={{
            position: 'absolute', top: 16, left: 16, right: 16,
            height: 2, background: 'var(--border)', zIndex: 0,
          }} />

          {phases.map((phase, i) => {
            const isDone    = phase.week < currentWeek
            const isCurrent = phase.week === currentWeek || (i === phases.length - 1 && currentWeek > phase.week)
            const isPendingPhase = phase.week > currentWeek

            return (
              <div
                key={phase.label}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, gap: 10 }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: isDone ? 'var(--grad)' : 'var(--surface)',
                  border: isDone ? 'none' : isCurrent ? '2.5px solid var(--cyan)' : '2px solid var(--border)',
                  boxShadow: isCurrent ? '0 0 0 5px rgba(0,200,224,0.12)' : 'none',
                  transition: 'all 0.3s var(--ease)',
                }}>
                  {isDone       && <i className="fa-solid fa-check" style={{ fontSize: 12, color: '#fff' }} />}
                  {isCurrent    && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--cyan)' }} />}
                  {isPendingPhase && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />}
                </div>

                <div style={{ textAlign: 'center', paddingBottom: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isDone ? 'var(--text)' : isCurrent ? 'var(--blue)' : 'var(--text3)', marginBottom: 2 }}>
                    {phase.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>{phase.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* AI suggestions */}
        {visible.length > 0 && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <i className="fa-solid fa-sparkles" style={{
                fontSize: 11,
                background: 'var(--grad)', WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>
                AI-suggested additions for your journey
              </span>
            </div>
            {visible.map((s) => (
              <div
                key={s.idx}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: 'var(--grad-soft)',
                  border: '1px solid var(--blue-light)',
                  borderRadius: 'var(--r)',
                  padding: '10px 14px',
                }}
              >
                <i className="fa-solid fa-circle-plus" style={{ fontSize: 13, color: 'var(--blue)', marginTop: 1, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{s.title}</div>
                  {s.reason && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.reason}</div>}
                </div>
                {journeyId && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 10, padding: '3px 10px' }}
                      disabled={isPending}
                      onClick={() => handleAccept(s)}
                      title="Add this task to your journey"
                    >
                      <i className="fa-solid fa-plus" style={{ marginRight: 4 }} />
                      Add
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 10, padding: '3px 8px', color: 'var(--text3)' }}
                      onClick={() => handleDismiss(s.idx)}
                      title="Dismiss suggestion"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Accepted confirmation */}
        {accepted.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-circle-check" />
            {accepted.length} suggestion{accepted.length > 1 ? 's' : ''} added to your task list.
          </div>
        )}

        {/* Context text */}
        <div style={{ marginTop: 18, fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
          You are on <strong style={{ color: 'var(--text2)' }}>Week {currentWeek}</strong> of your 90-day onboarding journey.
          {progressPct < 100
            ? ` ${Math.round(((totalWeeks - currentWeek) / totalWeeks) * 100)}% remaining until full productivity.`
            : ' You have completed your onboarding journey — congratulations!'}
        </div>
      </div>
    </div>
  )
}
