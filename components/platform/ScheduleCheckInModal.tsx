'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export interface CheckInHiree {
  journeyId?: string
  /** Legacy: some callers pass `id` instead of `journeyId` */
  id?: string
  name: string
  role: string
}

interface ScheduleCheckInModalProps {
  onClose: () => void
  hirees?: CheckInHiree[]
}

const DEFAULT_HIREES: CheckInHiree[] = [
  { id: 'j1', name: 'Liam Evans',   role: 'Frontend Engineer' },
  { id: 'j2', name: 'Priya Mehta',  role: 'Product Designer' },
  { id: 'j3', name: 'James Wilson', role: 'Sales Account Exec' },
]

const CHECK_IN_TYPES = [
  { value: 'weekly',  label: 'Weekly 1:1' },
  { value: 'day30',   label: '30-Day Review' },
  { value: 'day60',   label: '60-Day Review' },
  { value: 'day90',   label: '90-Day Review' },
  { value: 'ad-hoc',  label: 'Ad-hoc Check-in' },
]

export default function ScheduleCheckInModal({ onClose, hirees = DEFAULT_HIREES }: ScheduleCheckInModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const journeyId = fd.get('journey_id') as string
    const type = fd.get('type') as string
    const date = fd.get('date') as string
    const notes = fd.get('notes') as string

    setLoading(true)
    try {
      const res = await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journey_id: journeyId, type, scheduled_date: date, notes }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to schedule check-in')
      }

      setSuccess(true)
      setTimeout(onClose, 1800)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(13,21,41,0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
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
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r)', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fa-solid fa-calendar-check" style={{ fontSize: 16, color: 'var(--blue)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Schedule Check-in</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Set up a 1:1 or review meeting with a team member</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)', padding: '6px 8px' }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        {success ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 24, color: 'var(--green)' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Check-in Scheduled!</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>The hire has been notified automatically.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="fg">
                <label>Team Member</label>
                <select name="journey_id" required>
                  <option value="">Select team member</option>
                  {hirees.map(h => {
                    const val = h.journeyId ?? h.id ?? ''
                    return <option key={val} value={val}>{h.name} — {h.role}</option>
                  })}
                </select>
              </div>

              <div className="fg">
                <label>Check-in Type</label>
                <select name="type" required>
                  {CHECK_IN_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="fg">
                  <label>Date</label>
                  <input type="date" name="date" defaultValue={defaultDate} required />
                </div>
                <div className="fg">
                  <label>Time</label>
                  <input type="time" name="time" defaultValue="10:00" />
                </div>
              </div>

              <div className="fg">
                <label>Notes (optional)</label>
                <textarea
                  name="notes"
                  placeholder="Agenda items or context for this check-in..."
                  rows={3}
                  style={{ resize: 'none', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', padding: '10px 14px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {error && (
                <div style={{ fontSize: 12, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="fa-solid fa-circle-exclamation" />
                  {error}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, background: 'var(--surface2)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading} style={{ flex: 2 }}>
                {loading
                  ? <><i className="fa-solid fa-spinner fa-spin" /> Scheduling...</>
                  : <><i className="fa-solid fa-calendar-plus" /> Schedule Check-in</>
                }
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
