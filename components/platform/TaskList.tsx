'use client'

import { toggleTaskComplete } from '@/app/(platform)/hire/actions'
import { useTransition } from 'react'

interface Task {
  id: string
  title: string
  description: string
  week: number
  status: string
  assigned_to_role: string
}

export default function TaskList({ tasks, currentWeek }: { tasks: Task[]; currentWeek?: number }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(taskId: string, currentStatus: string) {
    startTransition(() => {
      toggleTaskComplete(taskId, currentStatus !== 'completed')
    })
  }

  const weeks = Array.from(new Set(tasks.map(t => t.week))).sort((a, b) => a - b)

  if (tasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text3)' }}>
        <i className="fa-solid fa-circle-check" style={{ fontSize: 22, color: 'var(--green)', display: 'block', marginBottom: 8 }} />
        <p style={{ fontSize: 13, fontWeight: 500 }}>No tasks for this period.</p>
      </div>
    )
  }

  return (
    <div>
      {weeks.map((week) => {
        const weekTasks = tasks.filter(t => t.week === week)
        const isCurrent = week === currentWeek

        return (
          <div key={week} style={{ marginBottom: 20 }}>
            <h4 style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: isCurrent ? 'var(--blue)' : 'var(--text3)',
              marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              Week {week}
              {isCurrent && (
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '1px 6px',
                  background: 'var(--cyan-light)', color: 'var(--blue)',
                  borderRadius: 100,
                }}>Current</span>
              )}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {weekTasks.map((t) => {
                const done = t.status === 'completed'
                return (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px',
                      background: done ? 'var(--surface2)' : 'var(--surface)',
                      border: `1px solid ${done ? 'var(--border)' : 'var(--border)'}`,
                      borderRadius: 'var(--r)',
                      opacity: done ? 0.65 : 1,
                      transition: 'opacity 0.2s, background 0.2s',
                    }}
                  >
                    <button
                      onClick={() => handleToggle(t.id, t.status)}
                      disabled={isPending}
                      aria-label={done ? `Mark "${t.title}" as incomplete` : `Mark "${t.title}" as complete`}
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
                      <strong style={{
                        display: 'block', fontSize: 13, fontWeight: 600,
                        color: done ? 'var(--text3)' : 'var(--text)',
                        textDecoration: done ? 'line-through' : 'none',
                        textDecorationColor: 'var(--text3)',
                      }}>
                        {t.title}
                      </strong>
                      {t.description && (
                        <span style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>
                          {t.description}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
