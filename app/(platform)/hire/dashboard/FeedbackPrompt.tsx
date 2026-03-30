'use client'

import { useState } from 'react'
import FeedbackModal from '@/components/platform/FeedbackModal'

interface Props {
  journeyId: string
  pendingMilestones: string[]
}

export default function FeedbackPrompt({ journeyId, pendingMilestones }: Props) {
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = pendingMilestones.filter((m) => !dismissed.has(m))

  if (visible.length === 0) return null

  return (
    <>
      <div style={{
        background: 'var(--grad-soft)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <i className="fa-solid fa-star" style={{ color: 'var(--amber, #ffa726)' }}></i>
          <strong style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem' }}>
            Share your feedback!
          </strong>
        </div>
        <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginBottom: '12px' }}>
          You have completed milestone check-ins. Let us know how your onboarding is going.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {visible.map((milestone) => (
            <button
              key={milestone}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem' }}
              onClick={() => setActiveMilestone(milestone)}
            >
              {milestone.replace('_', ' ').replace('day', 'Day ')} Feedback
            </button>
          ))}
        </div>
      </div>

      {activeMilestone && (
        <FeedbackModal
          journeyId={journeyId}
          milestone={activeMilestone}
          onClose={() => {
            setDismissed((prev) => new Set(prev).add(activeMilestone))
            setActiveMilestone(null)
          }}
        />
      )}
    </>
  )
}
