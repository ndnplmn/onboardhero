'use client'

import { useState, useEffect } from 'react'

interface JourneyOutcomeModalProps {
  journeyId: string
  userName:  string
}

const STORAGE_KEY = (id: string) => `journey_outcome_submitted_${id}`

export default function JourneyOutcomeModal({ journeyId, userName }: JourneyOutcomeModalProps) {
  const [show, setShow]           = useState(false)
  const [rating, setRating]       = useState(0)
  const [hoverRating, setHover]   = useState(0)
  const [daysToContrib, setDays]  = useState('')
  const [retention, setRetention] = useState('')
  const [notes, setNotes]         = useState('')
  const [status, setStatus]       = useState<'idle' | 'saving' | 'done'>('idle')

  useEffect(() => {
    const submitted = localStorage.getItem(STORAGE_KEY(journeyId))
    if (!submitted) setShow(true)
  }, [journeyId])

  if (!show) return null

  async function handleSubmit() {
    if (!rating || !retention) return
    setStatus('saving')
    await fetch('/api/journey-outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ journeyId, rating, daysToFirstContribution: Number(daysToContrib) || null, retention, notes }),
    })
    localStorage.setItem(STORAGE_KEY(journeyId), '1')
    setStatus('done')
    setTimeout(() => setShow(false), 2200)
  }

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget && status !== 'saving') setShow(false) }}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        {status === 'done' ? (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: 40, color: 'var(--green)', display: 'block', marginBottom: 14 }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              Thank you, {userName.split(' ')[0]}!
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>
              Your outcome report helps improve onboarding for future hires.
            </p>
          </div>
        ) : (
          <>
            <button className="modal-close" onClick={() => setShow(false)} aria-label="Close" disabled={status === 'saving'}>
              <i className="fa-solid fa-xmark" />
            </button>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="fa-solid fa-flag-checkered" style={{ color: '#fff', fontSize: 14 }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: 0 }}>
                    Journey Complete!
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>
                    Take 2 minutes to share how it went
                  </p>
                </div>
              </div>
            </div>

            {/* Star rating */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                How would you rate your onboarding experience?
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                      fontSize: 26,
                      color: n <= (hoverRating || rating) ? '#FBBF24' : 'var(--border2)',
                      transition: 'color 0.15s',
                    }}
                    aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                  >
                    <i className="fa-solid fa-star" />
                  </button>
                ))}
              </div>
            </div>

            {/* Days to first contribution */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                Approximately how many days until you felt you were contributing?
              </label>
              <input
                type="number"
                min={1}
                max={180}
                value={daysToContrib}
                onChange={e => setDays(e.target.value)}
                placeholder="e.g. 21"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '9px 12px', borderRadius: 'var(--r)',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  fontSize: 13, color: 'var(--text)', fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Retention status */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                Retention status <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { value: 'retained',          label: 'Still at the company' },
                  { value: 'left_within_90',    label: 'Left within 90 days' },
                  { value: 'left_after_90',     label: 'Left after 90 days' },
                  { value: 'internal_transfer', label: 'Internal transfer' },
                ].map(opt => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="retention"
                      value={opt.value}
                      checked={retention === opt.value}
                      onChange={() => setRetention(opt.value)}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
                Any additional notes? <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What worked well? What could be improved?"
                style={{
                  width: '100%', boxSizing: 'border-box', resize: 'vertical',
                  padding: '9px 12px', borderRadius: 'var(--r)',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  fontSize: 13, color: 'var(--text)', fontFamily: 'inherit', lineHeight: 1.5,
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleSubmit}
              disabled={!rating || !retention || status === 'saving'}
            >
              {status === 'saving'
                ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</>
                : <><i className="fa-solid fa-paper-plane" /> Submit Outcome Report</>
              }
            </button>
          </>
        )}
      </div>
    </div>
  )
}
