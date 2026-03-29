'use client'

import { useState, useTransition } from 'react'
import { toggleManagerTask, addTaskNote, approveTask } from '../../actions'

interface Task {
  id: string
  title: string
  status: string
  week: number
  assigned_to_role: string
  notes?: string | null
  requires_approval?: boolean
  approved_by?: string | null
  approved_at?: string | null
}

interface TeamMemberTasksProps {
  tasks: Task[]
  currentWeek: number
}

export default function TeamMemberTasks({ tasks, currentWeek }: TeamMemberTasksProps) {
  const [isPending, startTransition] = useTransition()
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)

  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  function handleToggle(taskId: string, currentlyCompleted: boolean) {
    setPendingTaskId(taskId)
    startTransition(async () => {
      await toggleManagerTask(taskId, !currentlyCompleted)
      setPendingTaskId(null)
    })
  }

  function handleOpenNote(task: Task) {
    setEditingNoteId(task.id)
    setNoteText(task.notes || '')
  }

  function handleSaveNote(taskId: string) {
    startTransition(async () => {
      await addTaskNote(taskId, noteText)
      setEditingNoteId(null)
      setNoteText('')
    })
  }

  function handleApprove(taskId: string) {
    setPendingTaskId(taskId)
    startTransition(async () => {
      await approveTask(taskId)
      setPendingTaskId(null)
    })
  }

  return (
    <div style={{ marginTop: '32px' }}>
      <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', marginBottom: '16px' }}>
        Tasks ({completedTasks}/{totalTasks} completed — {progress}%)
      </h2>
      {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
        const weekTasks = tasks.filter((t) => t.week === week)
        if (weekTasks.length === 0) return null
        const isCurrentWeek = week === currentWeek
        return (
          <div key={week} style={{ marginBottom: '16px' }}>
            <h3 style={{
              fontSize: '0.95rem',
              color: isCurrentWeek ? 'var(--cyan)' : 'var(--text2)',
              marginBottom: '8px',
              fontWeight: isCurrentWeek ? 700 : 400,
            }}>
              Week {week} {isCurrentWeek && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>(current)</span>}
            </h3>
            {weekTasks.map((t) => {
              const isCompleted = t.status === 'completed'
              const isManagerTask = t.assigned_to_role === 'manager'
              const showApprove = t.requires_approval && isCompleted && !t.approved_at
              const isApproved = !!t.approved_at
              const isThisPending = pendingTaskId === t.id && isPending

              return (
                <div key={t.id}>
                  <div
                    className="hc-emp"
                    style={{
                      opacity: isCompleted ? 0.6 : 1,
                      alignItems: 'center',
                    }}
                  >
                    {/* Toggle button for manager tasks, static icon for others */}
                    {isManagerTask ? (
                      <button
                        onClick={() => handleToggle(t.id, isCompleted)}
                        disabled={isThisPending}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: isThisPending ? 'wait' : 'pointer',
                          padding: 0,
                          width: '26px',
                          textAlign: 'center',
                          opacity: isThisPending ? 0.5 : 1,
                        }}
                        title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        <i
                          className={`fa-solid ${isCompleted ? 'fa-circle-check' : 'fa-circle'}`}
                          style={{ color: isCompleted ? 'var(--green)' : 'var(--text3)' }}
                        ></i>
                      </button>
                    ) : (
                      <i
                        className={`fa-solid ${isCompleted ? 'fa-circle-check' : 'fa-circle'}`}
                        style={{ color: isCompleted ? 'var(--green)' : 'var(--text3)', width: '26px', textAlign: 'center' }}
                      ></i>
                    )}

                    <div className="hce-info" style={{ flex: 1 }}>
                      <strong>{t.title}</strong>
                      <span>
                        {t.assigned_to_role === 'new_hire' ? 'New Hire' : t.assigned_to_role === 'manager' ? 'Manager' : 'HR'}
                      </span>
                    </div>

                    {/* Badges and action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                      {isApproved && (
                        <span className="badge-on" style={{ fontSize: '0.75rem' }}>
                          <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i>Approved
                        </span>
                      )}

                      {showApprove && (
                        <button
                          className="btn btn-outline"
                          onClick={() => handleApprove(t.id)}
                          disabled={isThisPending}
                          style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                        >
                          {isThisPending ? 'Approving...' : 'Approve'}
                        </button>
                      )}

                      {/* Note button */}
                      <button
                        onClick={() => handleOpenNote(t)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: t.notes ? 'var(--cyan)' : 'var(--text3)',
                        }}
                        title={t.notes ? 'Edit note' : 'Add note'}
                      >
                        <i className="fa-solid fa-note-sticky"></i>
                      </button>
                    </div>
                  </div>

                  {/* Inline note editor */}
                  {editingNoteId === t.id && (
                    <div style={{
                      padding: '8px 16px 12px 42px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                    }}>
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note..."
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: 'var(--r-md, 6px)',
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          color: 'var(--text)',
                          fontSize: '0.85rem',
                          fontFamily: 'inherit',
                        }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSaveNote(t.id)}
                        disabled={isPending}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => { setEditingNoteId(null); setNoteText('') }}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Show existing note (when not editing) */}
                  {t.notes && editingNoteId !== t.id && (
                    <div style={{
                      padding: '2px 16px 8px 42px',
                      fontSize: '0.8rem',
                      color: 'var(--text3)',
                      fontStyle: 'italic',
                    }}>
                      <i className="fa-solid fa-note-sticky" style={{ marginRight: '6px', fontSize: '0.7rem' }}></i>
                      {t.notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
