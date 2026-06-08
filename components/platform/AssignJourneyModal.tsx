'use client'

import { useState, useEffect, useTransition } from 'react'
import { motion } from 'framer-motion'
import { assignJourneyToEmployee, getAvailableHires, getManagersList } from '@/app/(platform)/hr/journeys/actions'

interface Props {
  templateId: string
  templateName: string
  onClose: () => void
  onSuccess?: () => void
}

export default function AssignJourneyModal({ templateId, templateName, onClose, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [hires, setHires]       = useState<{ id: string; full_name: string; department: string }[]>([])
  const [managers, setManagers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading]   = useState(true)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    Promise.all([getAvailableHires(), getManagersList()]).then(([h, m]) => {
      setHires(h)
      setManagers(m)
      setLoading(false)
    })
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const employeeId = fd.get('employee_id') as string
    const managerId  = fd.get('manager_id') as string
    setError('')

    startTransition(async () => {
      const result = await assignJourneyToEmployee(templateId, employeeId, managerId)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => { onSuccess?.(); onClose() }, 1800)
      }
    })
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(13,21,41,0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--surface)',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--r)',
            background: 'var(--grad-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className="fa-solid fa-user-plus" style={{ fontSize: 16, color: 'var(--blue)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
              Assign Journey
            </div>
            <div style={{
              fontSize: 12, color: 'var(--text3)', marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              Template: <strong style={{ color: 'var(--text2)' }}>{templateName}</strong>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)', padding: '6px 8px' }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        {success ? (
          <div style={{ padding: '44px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--green-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 24, color: 'var(--green)' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Journey Assigned!</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>
              The hire will see their onboarding tasks on their next login.
            </div>
          </div>
        ) : loading ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ marginBottom: 12, display: 'block', fontSize: 20 }} />
            Loading team members...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{
                  background: 'var(--red-bg)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 'var(--r)', padding: '10px 14px',
                  fontSize: 13, color: 'var(--red)',
                }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }} />
                  {error}
                </div>
              )}

              <div className="fg">
                <label>Assign to New Hire</label>
                {hires.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text3)', padding: '10px 0' }}>
                    No unassigned hires available. Invite a new hire first.
                  </div>
                ) : (
                  <select name="employee_id" required>
                    <option value="">Select a new hire</option>
                    {hires.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.full_name}{h.department ? ` — ${h.department}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="fg">
                <label>Assign Manager</label>
                {managers.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text3)', padding: '10px 0' }}>
                    No managers found. Create a manager account first.
                  </div>
                ) : (
                  <select name="manager_id" required>
                    <option value="">Select a manager</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{
                background: 'var(--grad-soft)',
                border: '1px solid var(--blue-light)',
                borderRadius: 'var(--r)',
                padding: '12px 14px',
                fontSize: 12, color: 'var(--text2)',
                lineHeight: 1.55,
              }}>
                <i className="fa-solid fa-circle-info" style={{ color: 'var(--blue)', marginRight: 8 }} />
                The hire will receive an email invitation with their onboarding tasks and timeline immediately after assignment.
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex', gap: 10,
              background: 'var(--surface2)',
            }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isPending || hires.length === 0 || managers.length === 0}
                style={{ flex: 2 }}
              >
                {isPending
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Assigning...</>
                  : <><i className="fa-solid fa-paper-plane" /> Assign Journey</>
                }
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
