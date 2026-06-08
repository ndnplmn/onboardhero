'use client'

import { useState, useTransition } from 'react'
import { upsertGoal, updateGoalStatus, deleteGoal } from '@/app/(platform)/hire/actions'
import { useT } from '@/lib/i18n/context'

export interface JourneyGoal {
  id:          string
  milestone:   'day_30' | 'day_60' | 'day_90'
  title:       string
  description: string | null
  status:      'not_started' | 'in_progress' | 'completed'
}

interface GoalsBoardProps {
  journeyId:   string
  goals?:      JourneyGoal[]
  dayNumber?:  number
  role?:       string
  department?: string
  currentWeek?: number
}

const MILESTONES: { key: 'day_30' | 'day_60' | 'day_90'; tKey: string; day: number; color: string; icon: string }[] = [
  { key: 'day_30', tKey: 'day30', day: 30,  color: 'var(--cyan)',   icon: 'fa-solid fa-seedling'    },
  { key: 'day_60', tKey: 'day60', day: 60,  color: 'var(--blue)',   icon: 'fa-solid fa-chart-line'  },
  { key: 'day_90', tKey: 'day90', day: 90,  color: 'var(--violet)', icon: 'fa-solid fa-rocket'      },
]

const STATUS_CONFIG = {
  not_started: { tKey: 'notStarted', color: 'var(--text3)',  bg: 'var(--surface2)',  icon: 'fa-solid fa-circle'            },
  in_progress: { tKey: 'inProgress', color: 'var(--amber)',  bg: 'var(--amber-bg)',  icon: 'fa-solid fa-circle-half-stroke' },
  completed:   { tKey: 'completed',  color: 'var(--green)',  bg: 'var(--green-bg)',  icon: 'fa-solid fa-circle-check'      },
}

export default function GoalsBoard({ journeyId, goals = [], dayNumber = 1, role, department, currentWeek }: GoalsBoardProps) {
  const { t } = useT()
  const [isPending, startTransition]         = useTransition()
  const [addingFor, setAddingFor]            = useState<string | null>(null)
  const [newTitle, setNewTitle]              = useState('')
  const [newDesc, setNewDesc]                = useState('')
  const [suggestions, setSuggestions]        = useState<string[]>([])
  const [loadingSuggestions, setLoadingSugg] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  async function openForm(milestone: 'day_30' | 'day_60' | 'day_90') {
    setAddingFor(milestone)
    setNewTitle('')
    setNewDesc('')
    setSuggestions([])
    setLoadingSugg(true)
    try {
      const existing = goals.filter(g => g.milestone === milestone).map(g => g.title)
      const res = await fetch('/api/goals/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone, currentWeek, role, department, existingGoals: existing }),
      })
      const { suggestions: s } = await res.json()
      setSuggestions(s || [])
    } catch {
      setSuggestions([])
    } finally {
      setLoadingSugg(false)
    }
  }

  function handleAdd(milestone: 'day_30' | 'day_60' | 'day_90') {
    if (!newTitle.trim()) return
    startTransition(async () => {
      await upsertGoal(journeyId, milestone, newTitle.trim(), newDesc.trim() || undefined)
      setNewTitle('')
      setNewDesc('')
      setAddingFor(null)
      setSuggestions([])
    })
  }

  function handleStatusCycle(goal: JourneyGoal) {
    const next: Record<JourneyGoal['status'], JourneyGoal['status']> = {
      not_started: 'in_progress',
      in_progress: 'completed',
      completed:   'not_started',
    }
    startTransition(() => updateGoalStatus(goal.id, next[goal.status]))
  }

  function handleDelete(goalId: string) {
    setDeleteConfirmId(goalId)
  }

  function confirmDelete(goalId: string) {
    setDeleteConfirmId(null)
    startTransition(() => deleteGoal(goalId))
  }

  const completedTotal = goals.filter(g => g.status === 'completed').length
  const totalGoals     = goals.length

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-bullseye-arrow" style={{ color: 'var(--violet)' }} />
          {t('components.goalsBoard.title')}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {totalGoals > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: completedTotal === totalGoals ? 'var(--green)' : 'var(--text3)' }}>
              {t('components.goalsBoard.complete').replace('{done}', String(completedTotal)).replace('{total}', String(totalGoals))}
            </span>
          )}
          <span className="badge-ai">
            <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 3 }} />
            {t('components.goalsBoard.aiAssisted')}
          </span>
        </div>
      </div>

      <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {MILESTONES.map(ms => {
          const msGoals  = goals.filter(g => g.milestone === ms.key)
          const isLocked = dayNumber < ms.day - 7
          const isActive = addingFor === ms.key

          return (
            <div key={ms.key}>
              {/* Milestone header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 'var(--r)',
                    background: `color-mix(in srgb, ${ms.color} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${ms.color} 30%, transparent)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={ms.icon} style={{ fontSize: 11, color: ms.color }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isLocked ? 'var(--text3)' : 'var(--text)' }}>
                    {t(`components.goalsBoard.milestones.${ms.tKey}`)}
                  </span>
                  {isLocked && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 100, padding: '1px 6px' }}>
                      {t('components.goalsBoard.unlocksDay').replace('{day}', String(ms.day - 7))}
                    </span>
                  )}
                  {msGoals.length > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: ms.color, background: `color-mix(in srgb, ${ms.color} 10%, transparent)`, borderRadius: 100, padding: '1px 7px' }}>
                      {msGoals.filter(g => g.status === 'completed').length}/{msGoals.length}
                    </span>
                  )}
                </div>
                {!isLocked && !isActive && (
                  <button
                    onClick={() => openForm(ms.key)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 700, padding: '4px 10px',
                      borderRadius: 100, cursor: 'pointer',
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      color: ms.color, transition: 'all 0.15s',
                    }}
                  >
                    <i className="fa-solid fa-plus" style={{ fontSize: 9 }} />
                    {t('components.goalsBoard.addGoal')}
                  </button>
                )}
              </div>

              {/* Goal cards */}
              {msGoals.length === 0 && !isActive && !isLocked && (
                <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0', fontStyle: 'italic' }}>
                  {t('components.goalsBoard.noGoals')}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {msGoals.map(goal => {
                  const s = STATUS_CONFIG[goal.status]
                  return (
                    <div
                      key={goal.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 12px',
                        background: 'var(--surface2)', borderRadius: 'var(--r)',
                        border: `1px solid ${goal.status === 'completed' ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                        opacity: isPending ? 0.7 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      <button
                        onClick={() => handleStatusCycle(goal)}
                        disabled={isPending}
                        title={`Mark as: ${t(`components.goalsBoard.status.${STATUS_CONFIG[goal.status === 'completed' ? 'not_started' : goal.status === 'in_progress' ? 'completed' : 'in_progress'].tKey}`)}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, padding: 0, flexShrink: 0, marginTop: 1, fontSize: 14 }}
                      >
                        <i className={s.icon} />
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600, color: goal.status === 'completed' ? 'var(--text3)' : 'var(--text)',
                          textDecoration: goal.status === 'completed' ? 'line-through' : 'none',
                          lineHeight: 1.3, marginBottom: goal.description ? 3 : 0,
                        }}>
                          {goal.title}
                        </div>
                        {goal.description && (
                          <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{goal.description}</div>
                        )}
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 7px',
                        borderRadius: 100, background: s.bg, color: s.color,
                        flexShrink: 0, whiteSpace: 'nowrap',
                      }}>
                        {t(`components.goalsBoard.status.${s.tKey}`)}
                      </span>
                      {deleteConfirmId === goal.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => confirmDelete(goal.id)}
                            disabled={isPending}
                            style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}
                          >
                            {t('common.delete')}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: 'var(--surface)', color: 'var(--text3)', border: '1px solid var(--border)', cursor: 'pointer' }}
                          >
                            {t('components.goalsBoard.cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDelete(goal.id)}
                          disabled={isPending}
                          title="Remove goal"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0, flexShrink: 0, fontSize: 11, opacity: 0.6 }}
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Add goal inline form */}
              {isActive && (
                <div style={{ marginTop: 8, padding: '12px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: `1px solid color-mix(in srgb, ${ms.color} 25%, transparent)` }}>
                  {/* AI Suggestions */}
                  {loadingSuggestions ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
                      <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--blue)', fontSize: 10 }} />
                      {t('components.goalsBoard.generatingSuggestions')}
                    </div>
                  ) : suggestions.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--blue)', fontSize: 9 }} />
                        {t('components.goalsBoard.aiSuggestions')}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => setNewTitle(s)}
                            style={{
                              textAlign: 'left', fontSize: 12, fontWeight: 500,
                              padding: '6px 10px', borderRadius: 'var(--r)',
                              border: `1px solid ${newTitle === s ? ms.color : 'var(--border)'}`,
                              background: newTitle === s ? `color-mix(in srgb, ${ms.color} 10%, transparent)` : 'var(--surface)',
                              color: newTitle === s ? ms.color : 'var(--text2)',
                              cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1.4,
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <input
                    autoFocus
                    type="text"
                    placeholder={t('components.goalsBoard.goalTitlePlaceholder')}
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(ms.key); if (e.key === 'Escape') setAddingFor(null) }}
                    style={{
                      width: '100%', padding: '7px 10px', fontSize: 13,
                      borderRadius: 'var(--r)', border: '1px solid var(--border)',
                      background: 'var(--surface)', color: 'var(--text)',
                      outline: 'none', boxSizing: 'border-box', marginBottom: 6,
                    }}
                  />
                  <input
                    type="text"
                    placeholder={t('components.goalsBoard.goalDescPlaceholder')}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    style={{
                      width: '100%', padding: '6px 10px', fontSize: 12,
                      borderRadius: 'var(--r)', border: '1px solid var(--border)',
                      background: 'var(--surface)', color: 'var(--text)',
                      outline: 'none', boxSizing: 'border-box', marginBottom: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleAdd(ms.key)}
                      disabled={!newTitle.trim() || isPending}
                      style={{
                        fontSize: 11, fontWeight: 700, padding: '5px 14px',
                        borderRadius: 100, cursor: newTitle.trim() ? 'pointer' : 'not-allowed',
                        background: ms.color, border: 'none', color: '#fff',
                        opacity: newTitle.trim() ? 1 : 0.5,
                      }}
                    >
                      {isPending ? t('components.goalsBoard.saving') : t('components.goalsBoard.add')}
                    </button>
                    <button
                      onClick={() => { setAddingFor(null); setSuggestions([]) }}
                      style={{
                        fontSize: 11, fontWeight: 700, padding: '5px 12px',
                        borderRadius: 100, cursor: 'pointer',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        color: 'var(--text3)',
                      }}
                    >
                      {t('components.goalsBoard.cancel')}
                    </button>
                  </div>
                </div>
              )}

              {/* Divider between milestones */}
              <div style={{ height: 1, background: 'var(--border)', marginTop: 16 }} />
            </div>
          )
        })}

        {/* Footer */}
        <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: -8 }}>
          <i className="fa-solid fa-people-arrows" style={{ marginRight: 5, color: 'var(--violet)' }} />
          {t('components.goalsBoard.footer')}
        </p>
      </div>
    </div>
  )
}
