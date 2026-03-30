'use client'

import { useState, useTransition } from 'react'
import FormBuilder from '@/components/platform/FormBuilder'
import { deleteForm } from './actions'

interface Props {
  forms: any[]
  submissions: any[]
}

export default function FormsClient({ forms, submissions }: Props) {
  const [showBuilder, setShowBuilder] = useState(false)
  const [expandedForm, setExpandedForm] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function getSubmissionCount(formId: string) {
    return submissions.filter((s: any) => s.form_id === formId).length
  }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif" }}>Onboarding Forms</h1>
        <button className="btn btn-primary" onClick={() => setShowBuilder(true)}>
          <i className="fa-solid fa-plus"></i> Create Form
        </button>
      </div>

      {forms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <i className="fa-solid fa-file-circle-check" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }}></i>
          <p>No forms yet. Create one to collect onboarding data from new hires.</p>
        </div>
      ) : (
        <div className="hc-employees">
          {forms.map((form: any) => {
            const subCount = getSubmissionCount(form.id)
            const isExpanded = expandedForm === form.id
            const formSubmissions = submissions.filter((s: any) => s.form_id === form.id)

            return (
              <div key={form.id}>
                <div className="hc-emp" style={{ padding: '16px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: 'var(--r)',
                    background: 'var(--grad-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="fa-solid fa-file-circle-check" style={{ color: 'var(--cyan)' }}></i>
                  </div>
                  <div className="hce-info" style={{ flex: 1 }}>
                    <strong>{form.title}</strong>
                    <span>
                      {form.fields?.length || 0} fields · {subCount} submissions
                      {form.department && ` · ${form.department}`}
                    </span>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => setExpandedForm(isExpanded ? null : form.id)}
                  >
                    <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.8rem', color: 'var(--red)' }}
                    onClick={() => startTransition(() => deleteForm(form.id))}
                    disabled={isPending}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>

                {isExpanded && formSubmissions.length > 0 && (
                  <div style={{
                    marginLeft: '56px', marginBottom: '12px', padding: '12px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-lg)',
                  }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '10px' }}>Submissions</h4>
                    {formSubmissions.map((sub: any) => (
                      <div key={sub.id} style={{
                        padding: '8px 0', borderBottom: '1px solid var(--border)',
                        fontSize: '0.85rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong>{sub.employee?.full_name || 'Unknown'}</strong>
                          <span style={{ color: 'var(--text3)' }}>
                            {new Date(sub.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text3)' }}>
                          {Object.entries(sub.answers || {}).map(([key, val]) => {
                            const field = form.fields?.find((f: any) => f.id === key)
                            return (
                              <div key={key}>
                                <span style={{ fontWeight: 500 }}>{field?.label || key}:</span>{' '}
                                {String(val)}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && formSubmissions.length === 0 && (
                  <div style={{
                    marginLeft: '56px', marginBottom: '12px', padding: '12px',
                    color: 'var(--text3)', fontSize: '0.85rem',
                  }}>
                    No submissions yet.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showBuilder && <FormBuilder onClose={() => setShowBuilder(false)} />}
    </div>
  )
}
