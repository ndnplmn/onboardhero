'use client'

import { useState, useTransition } from 'react'
import type { FrictionPoint } from '@/components/platform/FrictionMap'
import { applyAISuggestion } from '@/app/(platform)/manager/actions'

interface Mutation {
  id: string
  type: 'ADD_TASK' | 'PRIORITIZE' | 'RELAX'
  reason: string
  taskTitle: string
}

const TYPE_META = {
  ADD_TASK:   { icon: 'fa-solid fa-circle-plus',    color: 'var(--blue)',  label: 'Add Task' },
  PRIORITIZE: { icon: 'fa-solid fa-arrow-trend-up', color: 'var(--amber)', label: 'Prioritize' },
  RELAX:      { icon: 'fa-solid fa-wind',            color: 'var(--cyan)',  label: 'Reduce Load' },
}

function deriveMutations(frictionPoints: FrictionPoint[], employeeName: string): Mutation[] {
  const mutations: Mutation[] = []
  const hasTechnical  = frictionPoints.some(f => f.type === 'technical' && f.severity !== 'low')
  const hasCulture    = frictionPoints.some(f => f.type === 'culture')
  const hasEngagement = frictionPoints.some(f => f.type === 'engagement')

  if (hasTechnical) mutations.push({
    id: 'mt1',
    type: 'ADD_TASK',
    reason: `Technical setup velocity is below peer average for ${employeeName}.`,
    taskTitle: 'Schedule 1hr mentoring session with senior engineer',
  })
  if (hasCulture) mutations.push({
    id: 'mt2',
    type: 'PRIORITIZE',
    reason: `${employeeName} has missed optional social events. Peer connection is a leading retention indicator.`,
    taskTitle: 'Team coffee chat this week',
  })
  if (hasEngagement) mutations.push({
    id: 'mt3',
    type: 'RELAX',
    reason: `Engagement signals are dropping. Reducing non-critical theoretical tasks may restore momentum.`,
    taskTitle: 'Optional: Company culture deep-dive doc',
  })

  if (mutations.length === 0) mutations.push({
    id: 'mt-default',
    type: 'ADD_TASK',
    reason: `Proactive suggestion: a peer introduction session in week ${frictionPoints.length > 0 ? 3 : 2} accelerates integration by 40%.`,
    taskTitle: 'Peer intro session (30 min)',
  })

  return mutations.slice(0, 2)
}

interface AIRecommendationsProps {
  journeyId: string
  employeeName: string
  frictionPoints: FrictionPoint[]
}

export default function AIRecommendations({ journeyId, employeeName, frictionPoints }: AIRecommendationsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [dismissing, setDismissing] = useState<Set<string>>(new Set())
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const mutations = deriveMutations(frictionPoints, employeeName)
  const visible = mutations.filter(m => !dismissed.has(m.id))

  function handleDismiss(id: string) {
    setDismissing(prev => new Set(prev).add(id))
    setTimeout(() => {
      setDismissed(prev => new Set(prev).add(id))
      setDismissing(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300)
  }

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-sparkles" style={{ color: 'var(--blue)' }} aria-hidden="true" />{' '}
          Aura Recommendations
        </h3>
        <span className="badge-ai">AI Powered</span>
      </div>

      <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 0',
            color: 'var(--text3)',
            fontSize: 13,
          }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: 15, color: 'var(--green)' }} />
            No pending recommendations
          </div>
        ) : (
          visible.map(mutation => {
            const meta = TYPE_META[mutation.type]
            const isLeaving = dismissing.has(mutation.id)

            return (
              <div
                key={mutation.id}
                style={{
                  position: 'relative',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r)',
                  padding: '14px 40px 14px 14px',
                  opacity: isLeaving ? 0 : 1,
                  maxHeight: isLeaving ? 0 : 200,
                  overflow: 'hidden',
                  transition: 'opacity 0.25s ease, max-height 0.3s ease',
                }}
              >
                {/* Dismiss */}
                <button
                  onClick={() => handleDismiss(mutation.id)}
                  aria-label="Dismiss recommendation"
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: 'var(--text3)',
                    fontSize: 13,
                    lineHeight: 1,
                    borderRadius: 4,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
                >
                  <i className="fa-solid fa-xmark" />
                </button>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <i
                    className={meta.icon}
                    style={{ fontSize: 15, color: meta.color, flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {mutation.type === 'ADD_TASK'   && 'Add recommended task'}
                    {mutation.type === 'PRIORITIZE' && 'Prioritize this week'}
                    {mutation.type === 'RELAX'      && 'Relax this deadline'}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 10,
                    fontWeight: 600,
                    color: meta.color,
                    background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${meta.color} 30%, transparent)`,
                    borderRadius: 4,
                    padding: '2px 6px',
                    lineHeight: 1.4,
                    flexShrink: 0,
                    marginRight: 8,
                  }}>
                    {meta.label}
                  </span>
                </div>

                {/* Reason */}
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55, margin: '0 0 8px' }}>
                  {mutation.reason}
                </p>

                {/* Task badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  color: 'var(--text3)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '3px 8px',
                  marginBottom: 12,
                }}>
                  <i className="fa-solid fa-list-check" style={{ fontSize: 10 }} aria-hidden="true" />
                  {mutation.taskTitle}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {applied.has(mutation.id) ? (
                    <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className="fa-solid fa-circle-check" /> Applied!
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11, opacity: applying.has(mutation.id) ? 0.6 : 1 }}
                      disabled={applying.has(mutation.id)}
                      onClick={() => {
                        if (mutation.type !== 'ADD_TASK') {
                          setApplied(prev => new Set(prev).add(mutation.id))
                          return
                        }
                        setApplying(prev => new Set(prev).add(mutation.id))
                        startTransition(async () => {
                          await applyAISuggestion(journeyId, mutation.taskTitle, mutation.reason)
                          setApplied(prev => new Set(prev).add(mutation.id))
                          setApplying(prev => { const n = new Set(prev); n.delete(mutation.id); return n })
                        })
                      }}
                    >
                      {applying.has(mutation.id) ? <i className="fa-solid fa-spinner fa-spin" /> : 'Apply'}
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => handleDismiss(mutation.id)}>
                    Dismiss
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
