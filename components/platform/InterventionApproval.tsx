'use client'

import { useState } from 'react'

interface InterventionApprovalProps {
  hireName: string
  riskScore: number
  riskReasons: string[]
  suggestedMessage: string
  journeyId?: string
  onApprove: (msg: string) => Promise<void> | void
  onDismiss: () => void
}

export default function InterventionApproval({
  hireName,
  riskScore,
  riskReasons,
  suggestedMessage,
  journeyId,
  onApprove,
  onDismiss,
}: InterventionApprovalProps) {
  const [editing, setEditing]   = useState(false)
  const [msg, setMsg]           = useState(suggestedMessage)
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)

  const handleSend = async () => {
    setSending(true)
    try {
      await onApprove(msg)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  // ── Post-send confirmation — persists until manager explicitly dismisses ──
  if (sent) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid #16a34a',
        borderLeft: '4px solid #16a34a',
        borderRadius: 'var(--r)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 16, color: '#16a34a' }} />
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                Nudge sent to {hireName}
              </strong>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                Aura will re-scan risk score in 48 hours and notify you of any change.
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onDismiss} style={{ flexShrink: 0, fontSize: 11 }} aria-label="Dismiss">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', flex: 1 }}>
            <i className="fa-solid fa-clock" style={{ marginRight: 5 }} />
            Track whether {hireName}&apos;s engagement improves over the next week.
          </span>
          {journeyId && (
            <a
              href={`/manager/team/${journeyId}`}
              className="btn btn-outline btn-sm"
              style={{ textDecoration: 'none', fontSize: 11, flexShrink: 0 }}
            >
              <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /> View Journey
            </a>
          )}
        </div>
      </div>
    )
  }

  // ── Pre-send card ─────────────────────────────────────────────────────────
  return (
    <div style={{
      background: 'var(--surface)',
      borderLeft: '4px solid var(--amber)',
      borderRadius: 'var(--r)',
      padding: '16px 20px',
      boxShadow: '0 0 0 1px rgba(245,158,11,0.25), 0 4px 20px rgba(245,158,11,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--amber)' }}>
            Needs Your Action
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            Aura flagged {hireName} as at-risk
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>
            Risk score: <strong style={{ color: 'var(--red)' }}>{riskScore}</strong>
            {riskReasons.length > 0 && ` · ${riskReasons.slice(0, 2).join(' · ')}`}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onDismiss} style={{ flexShrink: 0, fontSize: 11 }} aria-label="Dismiss intervention">
          Dismiss
        </button>
      </div>

      {editing && (
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r)',
            padding: '10px 12px',
            fontSize: 13,
            color: 'var(--text)',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: 1.6,
            boxSizing: 'border-box',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSend}
          disabled={sending}
          aria-label={`Send nudge to ${hireName}`}
        >
          {sending
            ? <><i className="fa-solid fa-spinner fa-spin" /> Sending…</>
            : <><i className="fa-solid fa-bolt" aria-hidden="true" /> Send Nudge</>
          }
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => setEditing(prev => !prev)} aria-label="Edit message">
          <i className="fa-solid fa-pen" aria-hidden="true" /> {editing ? 'Hide' : 'Edit & Preview'}
        </button>
      </div>
    </div>
  )
}
