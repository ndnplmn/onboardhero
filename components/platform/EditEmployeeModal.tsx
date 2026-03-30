'use client'

import { useState, useTransition } from 'react'
import { updateEmployee } from '@/app/(platform)/hr/employees/actions'

interface Props {
  employee: { id: string; full_name: string; email: string; role: string; department: string; active: boolean }
  managers: { id: string; full_name: string }[]
  onClose: () => void
}

export default function EditEmployeeModal({ employee, managers, onClose }: Props) {
  const [role, setRole] = useState(employee.role)
  const [active, setActive] = useState(employee.active ?? true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('active', active ? 'true' : 'false')
    startTransition(async () => {
      const result = await updateEmployee(formData)
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
        <h2 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '20px' }}>Edit Employee</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="id" value={employee.id} />
          <div className="fg">
            <label>Full Name</label>
            <input name="full_name" type="text" defaultValue={employee.full_name} required />
          </div>
          <div className="fg">
            <label>Email</label>
            <input name="email" type="email" value={employee.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
          <div className="fg">
            <label>Role</label>
            <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="new_hire">New Hire</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
            </select>
          </div>
          <div className="fg">
            <label>Department</label>
            <input name="department" type="text" defaultValue={employee.department} />
          </div>
          <div className="fg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="active-checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <label htmlFor="active-checkbox" style={{ margin: 0 }}>Active</label>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={isPending} style={{ marginTop: '16px' }}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
