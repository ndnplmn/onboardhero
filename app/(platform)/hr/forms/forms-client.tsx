'use client'

import { useState, useTransition } from 'react'
import FormBuilder from '@/components/platform/FormBuilder'
import { deleteForm } from './actions'
import { useT } from '@/lib/i18n/context'

interface Props {
  forms: any[]
  submissions: any[]
}

export default function FormsClient({ forms, submissions }: Props) {
  const { t } = useT()
  const [showBuilder, setShowBuilder]   = useState(false)
  const [expandedForm, setExpandedForm] = useState<string | null>(null)
  const [isPending, startTransition]    = useTransition()

  function getSubmissionCount(formId: string) {
    return submissions.filter((s: any) => s.form_id === formId).length
  }

  return (
    <>
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i
              className="fa-solid fa-file-circle-check"
              style={{
                marginRight: 8,
                background: 'var(--grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              aria-hidden="true"
            />
            {t('hr.forms.title')}
          </h1>
          <p>{t('hr.forms.subtitle')}</p>
        </div>
        <div className="db-header-actions">
          <button
            className="btn btn-primary btn-sm btn-glow"
            onClick={() => setShowBuilder(true)}
            aria-label="Create a new onboarding form"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" style={{ marginRight: 6 }} />
            {t('hr.forms.createForm')}
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPI strip */}
        <div className="kpi-row" style={{ marginBottom: 0 }}>
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-file-circle-check" aria-hidden="true" /></div>
            <div className="kpi-value">{forms.length}</div>
            <div className="kpi-label">{t('hr.forms.totalForms')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-inbox" aria-hidden="true" /></div>
            <div className="kpi-value">{submissions.length}</div>
            <div className="kpi-label">{t('hr.forms.totalSubmissions')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-list" aria-hidden="true" /></div>
            <div className="kpi-value">
              {forms.length > 0
                ? Math.round(forms.reduce((acc, f) => acc + (f.fields?.length || 0), 0) / forms.length)
                : 0}
            </div>
            <div className="kpi-label">{t('hr.forms.avgFields')}</div>
          </div>
        </div>

        {/* Forms list */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3>
              <i className="fa-solid fa-layer-group" style={{ color: 'var(--blue)' }} aria-hidden="true" />
              {' '}{t('hr.forms.allForms')}
            </h3>
          </div>

          <div className="db-card-bd">
            {forms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <i className="fa-solid fa-file-circle-check" style={{ fontSize: 32, color: 'var(--border2)', display: 'block', marginBottom: 12 }} aria-hidden="true" />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>{t('hr.forms.noForms')}</p>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
                  {t('hr.forms.noFormsDesc')}
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowBuilder(true)}>
                  <i className="fa-solid fa-plus" aria-hidden="true" style={{ marginRight: 6 }} />
                  {t('hr.forms.createForm')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {forms.map((form: any, i: number) => {
                  const subCount    = getSubmissionCount(form.id)
                  const isExpanded  = expandedForm === form.id
                  const formSubs    = submissions.filter((s: any) => s.form_id === form.id)

                  return (
                    <div
                      key={form.id}
                      style={{
                        borderBottom: i < forms.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      {/* Form row */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 0',
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 'var(--r)',
                          background: 'var(--grad-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <i className="fa-solid fa-file-circle-check" style={{ color: 'var(--cyan)', fontSize: 16 }} aria-hidden="true" />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                            {form.title}
                          </strong>
                          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                            {form.fields?.length || 0} {t('hr.forms.fields')} · {subCount} {subCount !== 1 ? t('hr.forms.submissionsPlural') : t('hr.forms.submissions')}
                            {form.department && ` · ${form.department}`}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setExpandedForm(isExpanded ? null : form.id)}
                            aria-label={isExpanded ? t('hr.forms.hideSubmissions') : t('hr.forms.viewSubmissions')}
                            aria-expanded={isExpanded}
                          >
                            <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--red)' }}
                            onClick={() => startTransition(() => deleteForm(form.id))}
                            disabled={isPending}
                            aria-label={`${t('hr.forms.deleteForm')}: ${form.title}`}
                          >
                            <i className="fa-solid fa-trash" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded submissions */}
                      {isExpanded && (
                        <div style={{
                          marginLeft: 54, marginBottom: 14, padding: 14,
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--r-lg)',
                        }}>
                          {formSubs.length === 0 ? (
                            <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>No submissions yet.</p>
                          ) : (
                            <>
                              <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                                {t('hr.forms.submissionsPlural')}
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {formSubs.map((sub: any) => (
                                  <div
                                    key={sub.id}
                                    style={{
                                      padding: '10px 12px',
                                      background: 'var(--surface)',
                                      border: '1px solid var(--border)',
                                      borderRadius: 'var(--r)',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                      <strong style={{ fontSize: 12, color: 'var(--text)' }}>
                                        {sub.employee?.full_name || 'Unknown'}
                                      </strong>
                                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                                        {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      {Object.entries(sub.answers || {}).map(([key, val]) => {
                                        const field = form.fields?.find((f: any) => f.id === key)
                                        return (
                                          <div key={key} style={{ fontSize: 11, color: 'var(--text3)' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text2)' }}>
                                              {field?.label || key}:
                                            </span>{' '}
                                            {String(val)}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Feedback Insights */}
        <FeedbackInsights />

      </div>

      {showBuilder && <FormBuilder onClose={() => setShowBuilder(false)} />}
    </>
  )
}

// ── Feedback Insights ──────────────────────────────────────────────────────

function FeedbackInsights() {
  const sentiments = [
    { label: 'Positive', range: 'Rating 4–5', pct: 68, color: 'var(--green)',  bg: 'var(--green-bg)'  },
    { label: 'Neutral',  range: 'Rating 3',   pct: 21, color: 'var(--blue)',   bg: 'var(--blue-light)' },
    { label: 'Needs Attention', range: 'Rating 1–2', pct: 11, color: 'var(--amber)', bg: 'var(--amber-bg)' },
  ]

  const themes = [
    { emoji: '🏆', label: 'Onboarding process clarity',   note: '74% of positive responses' },
    { emoji: '⚠️', label: 'Technical tool access delays', note: '58% of lower-rated responses' },
    { emoji: '💡', label: 'Manager availability',          note: '42% of all responses' },
  ]

  const quarters = [
    { q: 'Q1', pct: 61 },
    { q: 'Q2', pct: 68 },
    { q: 'Q3', pct: 74 },
    { q: 'Q4', pct: 82, current: true },
  ]

  return (
    <div className="db-card">
      {/* Card header */}
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-chart-pie" style={{ color: 'var(--cyan)' }} aria-hidden="true" />
          {' '}Feedback Insights
        </h3>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Survey analytics · last 90 days</span>
      </div>

      <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 1. Sentiment Distribution */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 10 }}>
            Sentiment Distribution
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {sentiments.map(s => (
              <div
                key={s.label}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 'var(--r)',
                  background: s.bg, border: `1px solid ${s.color}33`,
                  textAlign: 'center',
                }}
              >
                <span style={{ display: 'block', fontSize: 20, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
                  {s.pct}%
                </span>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.label}</span>
                <span style={{ display: 'block', fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{s.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Key Themes */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 10 }}>
            Key Themes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {themes.map(th => (
              <div
                key={th.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r)',
                  background: 'var(--surface2)',
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{th.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{th.label}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text3)' }}>{th.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Response Rate Trend */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginBottom: 10 }}>
            Response Rate Trend
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {quarters.map(q => (
              <div key={q.q} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 28, fontSize: 11, fontWeight: 700,
                  color: q.current ? 'var(--cyan)' : 'var(--text3)',
                  flexShrink: 0,
                }}>
                  {q.q}
                </span>
                <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${q.pct}%`,
                    background: q.current ? 'var(--grad)' : 'var(--border2)',
                    borderRadius: 100,
                    transition: 'width 0.5s var(--ease)',
                  }} />
                </div>
                <span style={{
                  width: 32, fontSize: 11, fontWeight: 700, textAlign: 'right',
                  color: q.current ? 'var(--text)' : 'var(--text3)',
                  flexShrink: 0,
                }}>
                  {q.pct}%
                </span>
                {q.current && (
                  <span style={{ fontSize: 10, color: 'var(--cyan)', fontWeight: 700, flexShrink: 0 }}>NOW</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. AI Recommendation */}
        <div style={{
          padding: '14px 16px',
          borderRadius: 'var(--r)',
          background: 'var(--grad-soft)',
          border: '1px solid var(--cyan-light)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-sparkles" style={{ color: 'var(--cyan)', fontSize: 13 }} aria-hidden="true" />
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--cyan)' }}>
              Aura Insight
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
            Based on recent survey data, new hires are most satisfied with cultural integration but report friction in technical onboarding. Consider creating an IT Setup checklist task in Week 1 journeys.
          </p>
          <a
            href="/hr/journeys"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 700, color: 'var(--cyan)',
              textDecoration: 'none',
              alignSelf: 'flex-start',
            }}
          >
            Create Task Template
            <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} aria-hidden="true" />
          </a>
        </div>

      </div>
    </div>
  )
}
