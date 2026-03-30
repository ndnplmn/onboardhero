'use client'

import { useState, useTransition } from 'react'
import { submitForm } from '@/app/(platform)/hire/actions'

interface FormField {
  id: string
  type: string
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
}

interface Props {
  form: {
    id: string
    title: string
    description: string
    fields: FormField[]
  }
  journeyId: string | null
  onSubmitted: () => void
}

export default function FormRenderer({ form, journeyId, onSubmitted }: Props) {
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function updateAnswer(fieldId: string, value: string | boolean) {
    setAnswers({ ...answers, [fieldId]: value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate required fields
    for (const field of form.fields) {
      if (field.required) {
        const val = answers[field.id]
        if (val === undefined || val === '' || val === false) {
          setError(`"${field.label}" is required`)
          return
        }
      }
    }

    setError('')
    startTransition(async () => {
      await submitForm(form.id, journeyId, answers)
      onSubmitted()
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {form.description && (
        <p style={{ color: 'var(--text3)', marginBottom: '16px', fontSize: '0.9rem' }}>{form.description}</p>
      )}
      {error && <div className="auth-error" style={{ marginBottom: '12px' }}>{error}</div>}

      {form.fields.map((field) => (
        <div key={field.id} className="fg">
          <label>
            {field.label}
            {field.required && <span style={{ color: 'var(--red)', marginLeft: '4px' }}>*</span>}
          </label>

          {field.type === 'text' && (
            <input type="text" placeholder={field.placeholder || ''}
              value={(answers[field.id] as string) || ''}
              onChange={(e) => updateAnswer(field.id, e.target.value)} />
          )}

          {field.type === 'email' && (
            <input type="email" placeholder={field.placeholder || ''}
              value={(answers[field.id] as string) || ''}
              onChange={(e) => updateAnswer(field.id, e.target.value)} />
          )}

          {field.type === 'phone' && (
            <input type="tel" placeholder={field.placeholder || ''}
              value={(answers[field.id] as string) || ''}
              onChange={(e) => updateAnswer(field.id, e.target.value)} />
          )}

          {field.type === 'date' && (
            <input type="date"
              value={(answers[field.id] as string) || ''}
              onChange={(e) => updateAnswer(field.id, e.target.value)} />
          )}

          {field.type === 'textarea' && (
            <textarea placeholder={field.placeholder || ''}
              value={(answers[field.id] as string) || ''}
              onChange={(e) => updateAnswer(field.id, e.target.value)}
              style={{ minHeight: '80px', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface)', width: '100%', resize: 'vertical' }} />
          )}

          {field.type === 'select' && (
            <select value={(answers[field.id] as string) || ''}
              onChange={(e) => updateAnswer(field.id, e.target.value)}>
              <option value="">Select...</option>
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {field.type === 'checkbox' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={!!answers[field.id]}
                onChange={(e) => updateAnswer(field.id, e.target.checked)}
                style={{ width: 'auto' }} />
              {field.placeholder || 'Yes'}
            </label>
          )}
        </div>
      ))}

      <button type="submit" className="btn btn-primary" disabled={isPending} style={{ marginTop: '12px' }}>
        {isPending ? 'Submitting...' : 'Submit Form'}
      </button>
    </form>
  )
}
