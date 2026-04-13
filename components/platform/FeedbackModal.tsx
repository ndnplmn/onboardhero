'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitFeedback } from '@/app/(platform)/hire/actions'

interface Props {
  journeyId: string
  milestone: string
  onClose: () => void
}

const STAR_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent']

function milestoneLabel(m: string) {
  return m.replace('_', ' ').replace('day', 'Day ')
}

export default function FeedbackModal({ journeyId, milestone, onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comments, setComments] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (rating === 0) return
    startTransition(async () => {
      await submitFeedback(journeyId, milestone, rating, comments)
      onClose()
    })
  }

  const activeRating = hovered || rating

  return (
    <AnimatePresence>
      <div
        className="modal-overlay open"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="modal-box"
          style={{ maxWidth: 480 }}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>

          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 6 }}>
            How&apos;s your onboarding going?
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text2)' }}>{milestoneLabel(milestone)} milestone</strong> — your feedback helps us improve the experience.
          </p>

          {/* Star rating */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`Rate ${star} — ${STAR_LABELS[star - 1]}`}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '2rem',
                  color: star <= activeRating ? 'var(--amber)' : 'var(--border2)',
                  transition: 'transform 0.15s, color 0.15s',
                  transform: star <= activeRating ? 'scale(1.2)' : 'scale(1)',
                  padding: 4,
                }}
              >
                <i className="fa-solid fa-star" aria-hidden="true" />
              </button>
            ))}
          </div>

          {/* Rating label */}
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 20, minHeight: 18 }}>
            {activeRating > 0 ? STAR_LABELS[activeRating - 1] : ' '}
          </div>

          {/* Comments */}
          <div className="fg">
            <label htmlFor="feedback-comments">Comments <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              id="feedback-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What's going well? What could be better?"
              style={{
                minHeight: 80, padding: '10px 14px',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--r)',
                background: 'var(--surface)',
                width: '100%', resize: 'vertical',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--cyan)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            />
          </div>

          <button
            className="btn btn-primary btn-block"
            onClick={handleSubmit}
            disabled={isPending || rating === 0}
            style={{ marginTop: 16 }}
          >
            {isPending
              ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }} />Submitting...</>
              : 'Submit Feedback'
            }
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
