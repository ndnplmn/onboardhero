'use client'

import { useState, useTransition } from 'react'
import { submitFeedback } from '@/app/(platform)/hire/actions'

interface Props {
  journeyId: string
  milestone: string
  onClose: () => void
}

export default function FeedbackModal({ journeyId, milestone, onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [comments, setComments] = useState('')
  const [isPending, startTransition] = useTransition()

  const milestoneLabel = milestone.replace('_', ' ').replace('day', 'Day ')

  function handleSubmit() {
    if (rating === 0) return
    startTransition(async () => {
      await submitFeedback(journeyId, milestone, rating, comments)
      onClose()
    })
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '480px' }}>
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '8px' }}>
          How is your onboarding going?
        </h2>
        <p style={{ color: 'var(--text3)', marginBottom: '20px' }}>
          {milestoneLabel} milestone — share your experience so far.
        </p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '2rem', color: star <= rating ? 'var(--amber, #ffa726)' : 'var(--text4)',
                transition: 'transform 0.15s',
                transform: star <= rating ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              <i className="fa-solid fa-star"></i>
            </button>
          ))}
        </div>

        <div className="fg">
          <label>Comments (optional)</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="What's going well? What could be better?"
            style={{ minHeight: '80px', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface)', width: '100%', resize: 'vertical' }}
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleSubmit}
          disabled={isPending || rating === 0}
          style={{ marginTop: '16px' }}
        >
          {isPending ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  )
}
