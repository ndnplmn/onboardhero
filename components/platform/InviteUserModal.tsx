'use client'

import { useState, useTransition } from 'react'
import { inviteUser } from '@/app/(platform)/hr/employees/actions'

interface Props {
  managers: { id: string; full_name: string }[]
  templates: { id: string; name: string }[]
  onClose: () => void
}

export default function InviteUserModal({ managers, templates, onClose }: Props) {
  const [role, setRole] = useState('new_hire')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await inviteUser(formData)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '20px' }}>Invite Team Member</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label>Full Name</label>
            <input name="full_name" type="text" placeholder="John Doe" required />
          </div>
          <div className="fg">
            <label>Email</label>
            <input name="email" type="email" placeholder="john@company.com" required />
          </div>
          <div className="fg">
            <label>Role</label>
            <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="new_hire">New Hire</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className="fg">
            <label>Department</label>
            <input name="department" type="text" placeholder="Engineering" />
          </div>
          {role === 'new_hire' && (
            <>
              <div className="fg">
                <label>Assign Manager</label>
                <select name="manager_id" required>
                  <option value="">Select manager</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Journey Template</label>
                <select name="template_id" required>
                  <option value="">Select template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={isPending} style={{ marginTop: '16px' }}>
            {isPending ? 'Inviting...' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  )
}
