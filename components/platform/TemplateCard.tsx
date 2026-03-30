'use client'

import { deleteTemplate, cloneTemplate } from '@/app/(platform)/hr/journeys/actions'
import { useTransition } from 'react'

interface Props {
  template: {
    id: string
    name: string
    role_type: string
    department: string
    ai_generated: boolean
    duration_days: number
    created_at: string
  }
  taskCount: number
}

export default function TemplateCard({ template, taskCount }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="hc-emp" style={{ padding: '16px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--r)', background: 'var(--grad-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fa-solid fa-route" style={{ color: 'var(--cyan)' }}></i>
      </div>
      <div className="hce-info" style={{ flex: 1 }}>
        <strong>{template.name}</strong>
        <span>
          {template.role_type} · {template.department} · {taskCount} tasks · {template.duration_days} days
          {template.ai_generated && <span style={{ color: 'var(--cyan)', marginLeft: '8px' }}><i className="fa-solid fa-robot"></i> AI</span>}
        </span>
      </div>
      <button
        className="btn btn-ghost"
        style={{ fontSize: '0.8rem' }}
        onClick={() => startTransition(() => { cloneTemplate(template.id) })}
        disabled={isPending}
        title="Clone template"
      >
        <i className="fa-solid fa-copy"></i>
      </button>
      <button
        className="btn btn-ghost"
        style={{ fontSize: '0.8rem', color: 'var(--red)' }}
        onClick={() => startTransition(() => { deleteTemplate(template.id) })}
        disabled={isPending}
      >
        <i className="fa-solid fa-trash"></i>
      </button>
    </div>
  )
}
