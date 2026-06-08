'use client'

import { useState, useEffect } from 'react'
import type { FrictionPoint } from './FrictionMap'
import { motion } from 'framer-motion'

interface InterventionBriefProps {
  point: FrictionPoint
  onClose: () => void
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  technical:    { icon: 'fa-solid fa-laptop-code',       label: 'Technical',    color: 'var(--blue)',  bg: 'var(--blue-light)' },
  culture:      { icon: 'fa-solid fa-users',             label: 'Culture',      color: 'var(--cyan)',  bg: 'var(--cyan-light)' },
  engagement:   { icon: 'fa-solid fa-bolt',              label: 'Engagement',   color: 'var(--amber)', bg: 'var(--amber-bg)'   },
  role_clarity: { icon: 'fa-solid fa-compass',           label: 'Role Clarity', color: 'var(--aqua)',  bg: 'var(--aqua-light)' },
  mentorship:   { icon: 'fa-solid fa-handshake-angle',   label: 'Mentorship',   color: 'var(--green)', bg: 'var(--green-bg)'   },
}

const SEV_CONFIG = {
  low:    { label: 'Positive',       color: 'var(--green)', bg: 'var(--green-bg)', border: 'rgba(34,197,94,0.25)'  },
  medium: { label: 'Watch',          color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'rgba(245,158,11,0.25)' },
  high:   { label: 'Action Needed',  color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'rgba(239,68,68,0.25)'  },
}

export default function InterventionBrief({ point, onClose }: InterventionBriefProps) {
  const type = TYPE_CONFIG[point.type] ?? TYPE_CONFIG.technical
  const sev  = SEV_CONFIG[point.severity]

  const [aiBullets, setAiBullets] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coaching-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:          'your hire',
        riskScore:     point.severity === 'high' ? 75 : point.severity === 'medium' ? 45 : 20,
        sentimentScore: point.severity === 'high' ? 30 : 55,
        progress:      50,
        currentWeek:   Math.ceil((point.day ?? 1) / 7),
        lastPulse:     null,
        frictionPoints: [`${point.type}: ${point.label}`],
        pendingTasks:  2,
      }),
    })
      .then(r => r.json())
      .then(d => { if (d.bullets?.length) setAiBullets(d.bullets) })
      .catch(() => {})
      .finally(() => setAiLoading(false))
  }, [point.type, point.label, point.severity, point.day])

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
          width: '100%', maxWidth: 500,
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
            width: 44, height: 44, borderRadius: 'var(--r)',
            background: type.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className={type.icon} style={{ fontSize: 18, color: type.color }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
              {point.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Day {point.day} · {type.label}</span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: sev.color, background: sev.bg,
                border: `1px solid ${sev.border}`,
                padding: '1px 7px', borderRadius: 100,
              }}>
                {sev.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--text3)', padding: '6px 8px' }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Analysis */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Analysis
            </div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>
              {point.description}
            </p>
          </div>

          {/* AI Recommendation */}
          <div style={{
            background: 'var(--grad-soft)',
            border: '1px solid var(--blue-light)',
            borderLeft: '3px solid var(--cyan)',
            borderRadius: 'var(--r)',
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <i className="fa-solid fa-sparkles" style={{
                fontSize: 11,
                background: 'var(--grad)', WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Recommended Action
              </span>
              {aiLoading && <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 4 }} />}
            </div>
            {aiLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[85, 70, 90].map(w => (
                  <div key={w} style={{ height: 10, borderRadius: 5, background: 'var(--border)', width: `${w}%`, opacity: 0.6 }} />
                ))}
              </div>
            ) : aiBullets.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {aiBullets.map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <i className="fa-solid fa-circle-dot" style={{ color: 'var(--cyan)', fontSize: 9, marginTop: 4, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{b}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{point.intervention}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10,
          background: 'var(--surface2)',
        }}>
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>
            Dismiss
          </button>
          <button className="btn btn-primary btn-sm" style={{ flex: 2 }}>
            <i className="fa-solid fa-bolt" /> Execute Action
          </button>
        </div>
      </motion.div>
    </div>
  )
}
