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
    setJustSubmitted((prev) => new Set(prev).add(formId))
  }

  const pendingForms = forms.filter((f: any) => !f.submitted && !justSubmitted.has(f.id))
  const completedForms = forms.filter((f: any) => f.submitted || justSubmitted.has(f.id))

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '24px' }}>Onboarding Forms</h1>

      {pendingForms.length === 0 && completedForms.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <i className="fa-solid fa-file-circle-check" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }}></i>
          <p>No forms available yet.</p>
        </div>
      )}

      {pendingForms.length > 0 && (
        <>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', marginBottom: '12px' }}>
            Pending ({pendingForms.length})
          </h2>
          <div className="hc-employees" style={{ marginBottom: '28px' }}>
            {pendingForms.map((form: any) => (
              <div key={form.id}>
                <div className="hc-emp" style={{ padding: '16px', cursor: 'pointer' }}
                  onClick={() => setExpandedForm(expandedForm === form.id ? null : form.id)}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: 'var(--r)',
                    background: 'var(--grad-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="fa-solid fa-file-pen" style={{ color: 'var(--cyan)' }}></i>
                  </div>
                  <div className="hce-info" style={{ flex: 1 }}>
                    <strong>{form.title}</strong>
                    <span>{form.description || `${form.fields?.length || 0} fields`}</span>
                  </div>
                  <span style={{
                    background: 'var(--amber, #ffa726)20', color: 'var(--amber, #ffa726)',
                    padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                  }}>
                    Pending
                  </span>
                  <i className={`fa-solid ${expandedForm === form.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                    style={{ color: 'var(--text3)' }}></i>
                </div>
                {expandedForm === form.id && (
                  <div style={{
                    padding: '20px', marginBottom: '12px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '0 0 var(--r-lg) var(--r-lg)', marginTop: '-4px',
                  }}>
                    <FormRenderer form={form} journeyId={journeyId} onSubmitted={() => handleSubmitted(form.id)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {completedForms.length > 0 && (
        <>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', marginBottom: '12px' }}>
            Completed ({completedForms.length})
          </h2>
          <div className="hc-employees">
            {completedForms.map((form: any) => (
              <div key={form.id} className="hc-emp" style={{ padding: '16px', opacity: 0.7 }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--r)',
                  background: 'var(--green, #66bb6a)15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)' }}></i>
                </div>
                <div className="hce-info" style={{ flex: 1 }}>
                  <strong>{form.title}</strong>
                  <span>{form.description || 'Completed'}</span>
                </div>
                <span style={{
                  background: 'var(--green, #66bb6a)20', color: 'var(--green)',
                  padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                }}>
                  Completed
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
