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

  // Group by week
  const weeks = Array.from(new Set(tasks.map(t => t.week))).sort((a, b) => a - b)

  return (
    <div>
      {weeks.map((week) => {
        const weekTasks = tasks.filter(t => t.week === week)
        return (
          <div key={week} style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '0.95rem',
              color: week === currentWeek ? 'var(--cyan)' : 'var(--text2)',
              fontWeight: week === currentWeek ? 700 : 500,
              marginBottom: '10px',
              fontFamily: "'Outfit', sans-serif",
            }}>
              Week {week} {week === currentWeek && '← Current'}
            </h3>
            {weekTasks.map((t) => (
              <div key={t.id} className="hc-emp" style={{ opacity: t.status === 'completed' ? 0.6 : 1 }}>
                <button
                  onClick={() => handleToggle(t.id, t.status)}
                  disabled={isPending}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '1.1rem', width: '26px', textAlign: 'center',
                    color: t.status === 'completed' ? 'var(--green)' : 'var(--text3)',
                  }}
                >
                  <i className={`fa-solid ${t.status === 'completed' ? 'fa-circle-check' : 'fa-circle'}`}></i>
                </button>
                <div className="hce-info">
                  <strong style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.title}</strong>
                  {t.description && <span>{t.description}</span>}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
