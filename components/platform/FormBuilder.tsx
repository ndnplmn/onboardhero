'use client'

import { useState, useTransition } from 'react'
import { createForm } from '@/app/(platform)/hr/forms/actions'

interface FormField {
  id: string
  type: string
  label: string
  required: boolean
  placeholder: string
  options: string[]
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function FormBuilder({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [fields, setFields] = useState<FormField[]>([
    { id: generateId(), type: 'text', label: '', required: true, placeholder: '', options: [] },
  ])

  function addField() {
    setFields([...fields, { id: generateId(), type: 'text', label: '', required: false, placeholder: '', options: [] }])
  }

  function removeField(id: string) {
    setFields(fields.filter((f) => f.id !== id))
  }

  function updateField(id: string, updates: Partial<FormField>) {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const validFields = fields.filter((f) => f.label.trim())
    if (validFields.length === 0) {
      setError('Add at least one field with a label')
      return
    }
    formData.set('fields', JSON.stringify(validFields))
    startTransition(async () => {
      const result = await createForm(formData)
      if (result.error) setError(result.error)
      else onClose()
    })
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '20px' }}>Create Onboarding Form</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label>Form Title</label>
            <input name="title" type="text" placeholder="e.g. Personal Information" required />
          </div>
          <div className="fg">
            <label>Description</label>
            <input name="description" type="text" placeholder="Brief description of this form" />
          </div>
          <div className="fg">
            <label>Department (optional)</label>
            <input name="department" type="text" placeholder="Leave empty for all departments" />
          </div>

          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', margin: '20px 0 12px' }}>Fields</h3>

          {fields.map((field, index) => (
            <div key={field.id} style={{
              border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px',
              marginBottom: '12px', background: 'var(--surface)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text3)', fontWeight: 600 }}>Field {index + 1}</span>
                {fields.length > 1 && (
                  <button type="button" className="btn btn-ghost" style={{ fontSize: '0.75rem', color: 'var(--red)' }}
                    onClick={() => removeField(field.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="fg" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Label</label>
                  <input type="text" value={field.label} placeholder="Field label"
                    onChange={(e) => updateField(field.id, { label: e.target.value })} />
                </div>
                <div className="fg" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Type</label>
                  <select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value })}>
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
                <div className="fg" style={{ flex: 1, marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Placeholder</label>
                  <input type="text" value={field.placeholder} placeholder="Placeholder text"
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', marginTop: '18px' }}>
                  <input type="checkbox" checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    style={{ width: 'auto' }} />
                  Required
                </label>
              </div>
              {field.type === 'select' && (
                <div className="fg" style={{ marginTop: '8px', marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Options (comma-separated)</label>
                  <input type="text" value={field.options.join(', ')} placeholder="Option 1, Option 2, Option 3"
                    onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                </div>
              )}
            </div>
          ))}

          <button type="button" className="btn btn-outline" onClick={addField} style={{ width: '100%', marginBottom: '16px' }}>
            <i className="fa-solid fa-plus"></i> Add Field
          </button>

          <button type="submit" className="btn btn-primary btn-block" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Form'}
          </button>
        </form>
      </div>
    </div>
  )
}
