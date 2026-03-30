'use client'

import { useState } from 'react'
import InviteUserModal from '@/components/platform/InviteUserModal'
import EditEmployeeModal from '@/components/platform/EditEmployeeModal'

interface Props {
  profiles: any[]
  managers: any[]
  templates: any[]
  journeys: any[]
}

export default function EmployeesClient({ profiles, managers, templates, journeys }: Props) {
  const [showInvite, setShowInvite] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)

  const roleLabel: Record<string, string> = { hr: 'HR', manager: 'Manager', new_hire: 'New Hire' }
  const roleColor: Record<string, string> = { hr: 'var(--cyan)', manager: 'var(--blue)', new_hire: 'var(--aqua)' }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif" }}>Employees</h1>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
          <i className="fa-solid fa-plus"></i> Invite
        </button>
      </div>

      <div className="hc-employees">
        {profiles.map((p: any) => {
          const journey = journeys.find((j: any) => j.employee_id === p.id)
          return (
            <div key={p.id} className="hc-emp">
              <img src={p.avatar_url || `https://i.pravatar.cc/26?u=${p.id}`} alt="" />
              <div className="hce-info">
                <strong>{p.full_name}</strong>
                <span>{p.department || 'No department'} · {p.email}</span>
              </div>
              <span style={{
                background: roleColor[p.role] + '20',
                color: roleColor[p.role],
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                {roleLabel[p.role]}
              </span>
              {journey && (
                <span className={journey.status === 'at_risk' ? 'badge-risk' : 'badge-on'}>
                  {journey.status === 'at_risk' ? 'At risk' : journey.status === 'completed' ? 'Completed' : 'Active'}
                </span>
              )}
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.8rem' }}
                onClick={() => setEditingEmployee({ ...p, active: p.active ?? true })}
              >
                <i className="fa-solid fa-pen"></i>
              </button>
            </div>
          )
        })}
      </div>

      {showInvite && (
        <InviteUserModal
          managers={managers}
          templates={templates}
          onClose={() => setShowInvite(false)}
        />
      )}

      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          managers={managers}
          onClose={() => setEditingEmployee(null)}
        />
      )}
    </div>
  )
}
