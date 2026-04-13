'use client'

import { useState, useTransition } from 'react'
import { createTemplate } from '@/app/(platform)/hr/journeys/actions'

interface Task {
  title: string
  description: string
  week: number
  assigned_to_role: string
  order: number
}

export default function TemplateEditor({ onClose }: { onClose: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function addTask(week: number) {
    setTasks([...tasks, { title: '', description: '', week, assigned_to_role: 'new_hire', order: tasks.filter(t => t.week === week).length }])
  }

  function updateTask(index: number, field: string, value: string) {
    const updated = [...tasks]
    ;(updated[index] as unknown as Record<string, unknown>)[field] = value
    setTasks(updated)
  }

  function removeTask(index: number) {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('tasks', JSON.stringify(tasks.filter(t => t.title.trim())))
    startTransition(async () => {
      const result = await createTemplate(formData)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Create Journey Template</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row two">
            <div className="fg"><label>Template Name</label><input name="name" type="text" placeholder="e.g., Frontend Developer" required /></div>
            <div className="fg"><label>Role Type</label><input name="role_type" type="text" placeholder="e.g., Engineering" required /></div>
          </div>
          <div className="form-row two">
            <div className="fg"><label>Department</label><input name="department" type="text" placeholder="e.g., Product" required /></div>
            <div className="fg"><label>Description</label><input name="description" type="text" placeholder="Brief description" /></div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '16px' }}>Tasks by Week</h3>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
              const weekTasks = tasks.filter(t => t.week === week)
              return (
                <div key={week} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text2)' }}>Week {week}</strong>
                    <button type="button" className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => addTask(week)}>
                      <i className="fa-solid fa-plus"></i> Add Task
                    </button>
                  </div>
                  {weekTasks.map((t) => {
                    const idx = tasks.indexOf(t)
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={t.title}
                          onChange={(e) => updateTask(idx, 'title', e.target.value)}
                          placeholder="Task title"
                          style={{ flex: 1 }}
                        />
                        <select value={t.assigned_to_role} onChange={(e) => updateTask(idx, 'assigned_to_role', e.target.value)} style={{ width: '120px' }}>
                          <option value="new_hire">New Hire</option>
                          <option value="manager">Manager</option>
                          <option value="hr">HR</option>
                        </select>
                        <button type="button" onClick={() => removeTask(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isPending} style={{ marginTop: '16px' }}>
            {isPending ? 'Creating...' : 'Create Template'}
          </button>
        </form>
      </div>
    </div>
  )
}
