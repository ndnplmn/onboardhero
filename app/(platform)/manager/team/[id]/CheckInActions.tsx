'use client'

import { useState, useTransition } from 'react'
import { completeCheckIn, rescheduleCheckIn } from '../../actions'

interface CheckIn {
  id: string
  milestone_label?: string | null
  scheduled_date: string
  completed_date?: string | null
}

interface CheckInActionsProps {
  checkIns: CheckIn[]
}

export default function CheckInActions({ checkIns }: CheckInActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [notesId, setNotesId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const today = new Date().toISOString().split('T')[0]

  function requestComplete(checkInId: string) {
    setNotesId(checkInId)
    setNoteText('')
    setReschedulingId(null)
  }

  function handleComplete(checkInId: string, notes?: string) {
    setPendingId(checkInId)
    setNotesId(null)
    startTransition(async () => {
      await completeCheckIn(checkInId, notes)
      setPendingId(null)
    })
  }

  function handleReschedule(checkInId: string) {
    if (!newDate) return
    setPendingId(checkInId)
    startTransition(async () => {
      await rescheduleCheckIn(checkInId, newDate)
      setReschedulingId(null)
      setNewDate('')
      setPendingId(null)
    })
  }

  function toggleReschedule(checkInId: string, currentDate: string) {
    if (reschedulingId === checkInId) {
      setReschedulingId(null)
      setNewDate('')
    } else {
      setReschedulingId(checkInId)
      setNewDate(currentDate)
    }
  }

  if (checkIns.length === 0) return null

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-calendar-check" style={{ color: 'var(--blue)' }} aria-hidden="true" />
          {' '}Check-ins
        </h3>
      </div>
      <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {checkIns.map((ci) => {
          const isCompleted = !!ci.completed_date
          const isOverdue = !isCompleted && ci.scheduled_date < today
          const isThisPending = pendingId === ci.id && isPending

          return (
            <div key={ci.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--r-md, 6px)',
                  background: isCompleted ? 'var(--surface)' : 'var(--surface)',
                  borderLeft: `3px solid ${isCompleted ? 'var(--green)' : isOverdue ? 'var(--amber)' : 'var(--border)'}`,
                  opacity: isCompleted ? 0.6 : 1,
                }}
              >
                {/* Status icon */}
                <i
                  className={`fa-solid ${isCompleted ? 'fa-circle-check' : 'fa-circle'}`}
                  style={{
                    color: isCompleted ? 'var(--green)' : isOverdue ? 'var(--amber)' : 'var(--text3)',
                    fontSize: '1.1rem',
                  }}
                ></i>

                {/* Label and date */}
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.95rem' }}>
                    {ci.milestone_label || 'Check-in'}
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: '2px' }}>
                    {isCompleted
                      ? `Completed ${ci.completed_date}`
                      : `Scheduled for ${ci.scheduled_date}`
                    }
                    {isOverdue && (
                      <span style={{ color: 'var(--amber)', marginLeft: '8px', fontWeight: 600 }}>
                        Overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons for incomplete check-ins */}
                {!isCompleted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => toggleReschedule(ci.id, ci.scheduled_date)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: reschedulingId === ci.id ? 'var(--cyan)' : 'var(--text3)',
                      }}
                      title="Reschedule"
                    >
                      <i className="fa-solid fa-calendar-days"></i>
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => requestComplete(ci.id)}
                      disabled={isThisPending}
                      style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                    >
                      {isThisPending ? 'Saving...' : 'Done'}
                    </button>
                  </div>
                )}
              </div>

              {/* Inline reschedule date picker */}
              {reschedulingId === ci.id && (
                <div style={{
                  padding: '8px 16px 4px 32px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{
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
                    onClick={() => handleReschedule(ci.id)}
                    disabled={isPending || !newDate}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    Reschedule
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => { setReschedulingId(null); setNewDate('') }}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Inline notes panel before completing */}
              {notesId === ci.id && (
                <div style={{
                  margin: '6px 0 2px',
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Meeting Notes <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </div>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Key takeaways, blockers, next steps…"
                    rows={3}
                    maxLength={2000}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      padding: '8px 10px',
                      borderRadius: 'var(--r)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: 12,
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setNotesId(null)}
                      style={{ fontSize: 11 }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleComplete(ci.id)}
                      style={{ fontSize: 11, color: 'var(--text3)' }}
                    >
                      Skip Notes
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleComplete(ci.id, noteText)}
                      style={{ fontSize: 11 }}
                    >
                      <i className="fa-solid fa-circle-check" style={{ fontSize: 10 }} /> Mark Complete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

