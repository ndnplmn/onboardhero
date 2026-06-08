'use client'

import { useState } from 'react'
import FormRenderer from '@/components/platform/FormRenderer'
import { useT } from '@/lib/i18n/context'

interface Props {
  forms: any[]
  journeyId: string | null
}

// ── Survey Impact Card ─────────────────────────────────────────────────────

function SurveyImpactCard({ rating, formTitle }: { rating: number; formTitle: string }) {
  const isSurvey = formTitle.toLowerCase().includes('survey') || formTitle.toLowerCase().includes('check')
  if (!isSurvey) return null

  const message = rating >= 4
    ? { icon: 'fa-solid fa-circle-check', color: 'var(--green)', bg: 'var(--green-bg)',
        title: 'Great feedback!',
        body: 'Your positive response has been noted. Your manager will see this in their coaching dashboard.' }
    : rating >= 3
    ? { icon: 'fa-solid fa-circle-info', color: 'var(--blue)', bg: 'var(--blue-light)',
        title: 'Feedback received',
        body: "Your response helps your manager understand how to better support you. They'll reach out soon." }
    : { icon: 'fa-solid fa-triangle-exclamation', color: 'var(--amber)', bg: 'var(--amber-bg)',
        title: 'We hear you',
        body: 'Your feedback signals that you may need additional support. Your manager will be notified and will check in with you shortly.' }

  return (
    <div style={{ padding: '14px 16px', borderRadius: 'var(--r)', background: message.bg, border: `1px solid ${message.color}33`, display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 16 }}>
      <i className={message.icon} style={{ color: message.color, fontSize: 16, marginTop: 2 }} />
      <div>
        <strong style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{message.title}</strong>
        <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{message.body}</span>
      </div>
    </div>
  )
}

// ── Client component ───────────────────────────────────────────────────────

export default function HireFormsClient({ forms, journeyId }: Props) {
  const { t } = useT()
  const [expandedForm, setExpandedForm] = useState<string | null>(null)
  const [justSubmitted, setJustSubmitted] = useState<Set<string>>(new Set())
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null)

  function handleSubmitted(formId: string) {
    setExpandedForm(null)
    setJustSubmitted(prev => new Set(prev).add(formId))
    setLastSubmittedId(formId)
  }

  const pendingForms   = forms.filter(f => !f.submitted && !justSubmitted.has(f.id))
  const completedForms = forms.filter(f => f.submitted || justSubmitted.has(f.id))

  return (
    <>
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i
              className="fa-solid fa-file-pen"
              style={{
                marginRight: 8,
                background: 'var(--grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              aria-hidden="true"
            />
            {t('hire.forms.title')}
          </h1>
          <p>{t('hire.forms.subtitle')}</p>
        </div>
        {forms.length > 0 && (
          <div className="db-header-actions">
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>
              {completedForms.length} / {forms.length} {t('hire.forms.completedCount')}
            </span>
          </div>
        )}
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* Progress */}
        {forms.length > 0 && (
          <div className="db-card">
            <div className="db-card-bd">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                <span style={{ color: 'var(--text2)' }}>{t('hire.forms.formCompletion')}</span>
                <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>
                  {forms.length > 0 ? Math.round((completedForms.length / forms.length) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${forms.length > 0 ? Math.round((completedForms.length / forms.length) * 100) : 0}%`,
                  background: completedForms.length === forms.length ? 'var(--green)' : 'var(--grad)',
                  borderRadius: 100,
                  transition: 'width 0.5s var(--ease)',
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {forms.length === 0 && (
          <div className="db-card">
            <div className="db-card-bd" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <i className="fa-solid fa-file-circle-check" style={{ fontSize: 28, color: 'var(--border2)', display: 'block', marginBottom: 12 }} aria-hidden="true" />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>{t('hire.forms.noFormsTitle')}</p>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>{t('hire.forms.noFormsSubtitle')}</p>
            </div>
          </div>
        )}

        {/* Pending forms */}
        {pendingForms.length > 0 && (
          <div className="db-card">
            <div className="db-card-hd">
              <h3>
                <i className="fa-solid fa-clock" style={{ color: 'var(--amber)' }} aria-hidden="true" />
                {' '}{t('hire.forms.pending')} ({pendingForms.length})
              </h3>
            </div>
            <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingForms.map(form => (
                <div key={form.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedForm(expandedForm === form.id ? null : form.id)}
                    aria-expanded={expandedForm === form.id}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 14px',
                      borderRadius: 'var(--r)',
                      border: '1px solid var(--border)',
                      background: expandedForm === form.id ? 'var(--surface2)' : 'var(--surface)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--r)',
                      background: 'var(--grad-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <i className="fa-solid fa-file-pen" style={{ color: 'var(--cyan)', fontSize: 16 }} aria-hidden="true" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                        {form.title}
                      </strong>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {form.description || `${form.fields?.length || 0} fields`}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px',
                      borderRadius: 100, background: 'var(--amber-bg)', color: 'var(--amber)',
                      flexShrink: 0,
                    }}>
                      {t('hire.forms.pending')}
                    </span>
                    <i
                      className={`fa-solid ${expandedForm === form.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                      style={{ color: 'var(--text3)', flexShrink: 0 }}
                      aria-hidden="true"
                    />
                  </button>

                  {expandedForm === form.id && (
                    <div style={{
                      padding: 20, marginTop: 4,
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)',
                    }}>
                      <FormRenderer form={form} journeyId={journeyId} onSubmitted={() => handleSubmitted(form.id)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed forms */}
        {completedForms.length > 0 && (
          <div className="db-card">
            <div className="db-card-hd">
              <h3>
                <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)' }} aria-hidden="true" />
                {' '}{t('hire.forms.completed')} ({completedForms.length})
              </h3>
            </div>
            <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {completedForms.map(form => {
                const hasRatingField = (form.fields ?? []).some((f: any) => f.type === 'rating')
                const submittedRating = hasRatingField ? 3 : 0
                const isJustSubmitted = form.id === lastSubmittedId

                return (
                  <div key={form.id}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 14px',
                        borderRadius: 'var(--r)',
                        border: '1px solid var(--border)',
                        background: 'var(--surface2)',
                        opacity: 0.75,
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--r)',
                        background: 'var(--green-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)', fontSize: 16 }} aria-hidden="true" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{
                          display: 'block', fontSize: 13, fontWeight: 700,
                          color: 'var(--text3)',
                          textDecoration: 'line-through',
                          textDecorationColor: 'var(--text3)',
                          marginBottom: 2,
                        }}>
                          {form.title}
                        </strong>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {form.description || t('hire.forms.completed')}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px',
                        borderRadius: 100, background: 'var(--green-bg)', color: 'var(--green)',
                        flexShrink: 0,
                      }}>
                        {t('hire.forms.completed')}
                      </span>
                    </div>

                    {isJustSubmitted && hasRatingField && (
                      <SurveyImpactCard rating={submittedRating} formTitle={form.title} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
