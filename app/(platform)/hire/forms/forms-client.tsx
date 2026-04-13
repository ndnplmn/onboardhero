'use client'

import { useState } from 'react'
import FormRenderer from '@/components/platform/FormRenderer'

interface Props {
  forms: any[]
  journeyId: string | null
}

export default function HireFormsClient({ forms, journeyId }: Props) {
  const [expandedForm, setExpandedForm] = useState<string | null>(null)
  const [justSubmitted, setJustSubmitted] = useState<Set<string>>(new Set())

  function handleSubmitted(formId: string) {
    setExpandedForm(null)
    setJustSubmitted(prev => new Set(prev).add(formId))
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
            Onboarding Forms
          </h1>
          <p>Complete these forms as part of your onboarding journey.</p>
        </div>
        {forms.length > 0 && (
          <div className="db-header-actions">
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>
              {completedForms.length} / {forms.length} completed
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
                <span style={{ color: 'var(--text2)' }}>Form completion</span>
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
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No forms available yet</p>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>Your HR team will assign forms as your journey progresses.</p>
            </div>
          </div>
        )}

        {/* Pending forms */}
        {pendingForms.length > 0 && (
          <div className="db-card">
            <div className="db-card-hd">
              <h3>
                <i className="fa-solid fa-clock" style={{ color: 'var(--amber)' }} aria-hidden="true" />
                {' '}Pending ({pendingForms.length})
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
                      Pending
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
                {' '}Completed ({completedForms.length})
              </h3>
            </div>
            <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {completedForms.map(form => (
                <div
                  key={form.id}
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
                      {form.description || 'Completed'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px',
                    borderRadius: 100, background: 'var(--green-bg)', color: 'var(--green)',
                    flexShrink: 0,
                  }}>
                    Completed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  )
}
