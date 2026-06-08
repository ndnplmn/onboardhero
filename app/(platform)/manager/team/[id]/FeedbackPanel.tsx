'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/context'

interface FeedbackPanelProps {
  journeyId: string
  hireName:  string
}

// SBI = Situation · Behavior · Impact
const SBI_TEMPLATES = {
  positive: [
    {
      label: 'Task ownership',
      text: (name: string) => `In the [situation], ${name} [specific behavior]. This had a strong positive impact because [impact].`,
    },
    {
      label: 'Team collaboration',
      text: (name: string) => `During [meeting/project], I noticed ${name} [behavior]. The impact was [outcome], which helped the team [effect].`,
    },
    {
      label: 'Initiative',
      text: (name: string) => `When [situation arose], ${name} proactively [action]. This made a real difference because [impact].`,
    },
  ],
  constructive: [
    {
      label: 'Communication gap',
      text: (name: string) => `In [specific situation], I observed that ${name} [behavior]. The impact was [outcome]. Going forward, I'd suggest [specific action].`,
    },
    {
      label: 'Task completion',
      text: (name: string) => `When [task/deadline], ${name} [behavior]. This affected [impact]. One way to improve could be [concrete suggestion].`,
    },
    {
      label: 'Stakeholder interaction',
      text: (name: string) => `During [situation], I noticed [behavior]. The effect on [team/project] was [impact]. Let's work together on [improvement area].`,
    },
  ],
}

export default function FeedbackPanel({ journeyId, hireName }: FeedbackPanelProps) {
  const { t } = useT()
  const [type, setType]           = useState<'positive' | 'constructive'>('positive')
  const [content, setContent]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [showSBI, setShowSBI]     = useState(false)

  async function handleSubmit() {
    if (!content.trim() || loading) return
    setLoading(true)
    try {
      await fetch('/api/hire-feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ journeyId, content, feedbackType: type }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="fa-solid fa-check" style={{ color: '#fff', fontSize: 18 }} aria-hidden="true" />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
          {t('components.feedbackPanel.sentToPre')} {hireName}{t('components.feedbackPanel.sentToPost')}
        </p>
        <button
          className="btn btn-sm btn-outline"
          onClick={() => { setSent(false); setContent(''); setType('positive') }}
        >
          {t('components.feedbackPanel.sendAnother')}
        </button>
      </div>
    )
  }

  const firstName = hireName.split(' ')[0]
  const templates = SBI_TEMPLATES[type]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Title */}
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
        <i className="fa-solid fa-comment-dots" style={{ color: 'var(--blue)' }} aria-hidden="true" />
        {t('components.feedbackPanel.leaveFeedbackFor')} {hireName}
      </p>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className={`btn btn-sm ${type === 'positive' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setType('positive')}
          style={type === 'positive' ? { background: 'var(--green)', borderColor: 'var(--green)' } : {}}
        >
          <i className="fa-solid fa-circle-check" style={{ color: type === 'positive' ? '#fff' : 'var(--green)', marginRight: 5 }} aria-hidden="true" />
          {t('components.feedbackPanel.positive')}
        </button>
        <button
          className={`btn btn-sm ${type === 'constructive' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setType('constructive')}
          style={type === 'constructive' ? { background: 'var(--amber)', borderColor: 'var(--amber)' } : {}}
        >
          <i className="fa-solid fa-lightbulb" style={{ color: type === 'constructive' ? '#fff' : 'var(--amber)', marginRight: 5 }} aria-hidden="true" />
          {t('components.feedbackPanel.constructive')}
        </button>
      </div>

      {/* SBI Framework toggle */}
      <div>
        <button
          onClick={() => setShowSBI(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, color: 'var(--blue)', fontWeight: 600,
          }}
        >
          <i className={`fa-solid fa-chevron-${showSBI ? 'down' : 'right'}`} style={{ fontSize: 9 }} />
          {t('components.feedbackPanel.sbiToggle')}
        </button>

        {showSBI && (
          <div style={{
            marginTop: 8,
            padding: '10px 12px',
            background: 'color-mix(in srgb, var(--blue) 5%, transparent)',
            border: '1px solid color-mix(in srgb, var(--blue) 18%, transparent)',
            borderRadius: 'var(--r)',
          }}>
            <p style={{ fontSize: 10, color: 'var(--text3)', margin: '0 0 8px', lineHeight: 1.5 }}>
              {t('components.feedbackPanel.sbiDesc')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => { setContent(tpl.text(firstName)); setShowSBI(false) }}
                  style={{
                    textAlign: 'left', background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r)', padding: '6px 10px',
                    cursor: 'pointer', fontSize: 11, color: 'var(--text2)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <i className="fa-solid fa-file-lines" style={{ fontSize: 10, color: 'var(--blue)', flexShrink: 0 }} />
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={
          type === 'positive'
            ? t('components.feedbackPanel.positivePlaceholder')
            : t('components.feedbackPanel.constructivePlaceholder')
        }
        rows={4}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: 13,
          color: 'var(--text)',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.6,
          boxSizing: 'border-box',
        }}
      />

      {/* Submit */}
      <div>
        <button
          className="btn btn-sm btn-primary"
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
        >
          {loading ? (
            <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
          ) : (
            <i className="fa-solid fa-paper-plane" aria-hidden="true" />
          )}
          {loading ? t('components.feedbackPanel.sending') : t('components.feedbackPanel.submit')}
        </button>
      </div>
    </div>
  )
}
