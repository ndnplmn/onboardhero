'use client'

import { useState, useTransition } from 'react'
import FormBuilder from '@/components/platform/FormBuilder'
import { deleteForm } from './actions'

interface Props {
  forms: any[]
  submissions: any[]
}

export default function FormsClient({ forms, submissions }: Props) {
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
            Onboarding Forms
          </h1>
          <p>Create and manage forms to collect data from new hires during onboarding.</p>
        </div>
        <div className="db-header-actions">
          <button
            className="btn btn-primary btn-sm btn-glow"
            onClick={() => setShowBuilder(true)}
            aria-label="Create a new onboarding form"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" style={{ marginRight: 6 }} />
            Create Form
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPI strip */}
        <div className="kpi-row" style={{ marginBottom: 0 }}>
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-file-circle-check" aria-hidden="true" /></div>
            <div className="kpi-value">{forms.length}</div>
            <div className="kpi-label">Total Forms</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-inbox" aria-hidden="true" /></div>
            <div className="kpi-value">{submissions.length}</div>
            <div className="kpi-label">Total Submissions</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-list" aria-hidden="true" /></div>
            <div className="kpi-value">
              {forms.length > 0
                ? Math.round(forms.reduce((acc, f) => acc + (f.fields?.length || 0), 0) / forms.length)
                : 0}
            </div>
            <div className="kpi-label">Avg. Fields</div>
          </div>
        </div>

        {/* Forms list */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3>
              <i className="fa-solid fa-layer-group" style={{ color: 'var(--blue)' }} aria-hidden="true" />
              {' '}All Forms
            </h3>
          </div>

          <div className="db-card-bd">
            {forms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <i className="fa-solid fa-file-circle-check" style={{ fontSize: 32, color: 'var(--border2)', display: 'block', marginBottom: 12 }} aria-hidden="true" />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No forms yet</p>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
                  Create a form to collect onboarding data from new hires.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowBuilder(true)}>
                  <i className="fa-solid fa-plus" aria-hidden="true" style={{ marginRight: 6 }} />
                  Create Form
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
                            {form.fields?.length || 0} fields · {subCount} submission{subCount !== 1 ? 's' : ''}
                            {form.department && ` · ${form.department}`}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setExpandedForm(isExpanded ? null : form.id)}
                            aria-label={isExpanded ? 'Collapse submissions' : 'View submissions'}
                            aria-expanded={isExpanded}
                          >
                            <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--red)' }}
                            onClick={() => startTransition(() => deleteForm(form.id))}
                            disabled={isPending}
                            aria-label={`Delete form: ${form.title}`}
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
                                Submissions
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

      </div>

      {showBuilder && <FormBuilder onClose={() => setShowBuilder(false)} />}
    </>
  )
}
