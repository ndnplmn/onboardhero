'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FeedbackModal from '@/components/platform/FeedbackModal'

interface Props {
  journeyId: string
  pendingMilestones: string[]
}

function milestoneLabel(m: string) {
  return m.replace('_', ' ').replace('day', 'Day ')
}

export default function FeedbackPrompt({ journeyId, pendingMilestones }: Props) {
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = pendingMilestones.filter((m) => !dismissed.has(m))

  if (visible.length === 0) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          background: 'var(--grad-soft)',
          border: '1px solid var(--blue-light)',
          borderLeft: '3px solid var(--blue)',
          borderRadius: 'var(--r-lg)',
          padding: '18px 20px',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--r)',
          background: 'var(--grad)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <i className="fa-solid fa-star" style={{ fontSize: 14, color: '#fff' }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14, fontWeight: 700,
            color: 'var(--text)', marginBottom: 4,
          }}>
            Share your onboarding experience
          </div>
          <p style={{ color: 'var(--text3)', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
            You&apos;ve reached a milestone. Your feedback helps us improve the journey for everyone.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {visible.map((milestone) => (
              <button
                key={milestone}
                className="btn btn-primary btn-sm"
                onClick={() => setActiveMilestone(milestone)}
              >
                <i className="fa-solid fa-comment-dots" style={{ marginRight: 5 }} />
                {milestoneLabel(milestone)} Feedback
              </button>
            ))}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(new Set(pendingMilestones))}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text3)', padding: 4, flexShrink: 0,
          }}
          aria-label="Dismiss feedback prompt"
        >
          <i className="fa-solid fa-xmark" style={{ fontSize: 13 }} />
        </button>
      </motion.div>

      <AnimatePresence>
        {activeMilestone && (
          <FeedbackModal
            journeyId={journeyId}
            milestone={activeMilestone}
            onClose={() => {
              setDismissed((prev) => new Set(prev).add(activeMilestone!))
              setActiveMilestone(null)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
