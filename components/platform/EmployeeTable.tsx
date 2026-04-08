'use client'

import { useRouter } from 'next/navigation'

interface Employee {
  id: string
  name: string
  role: string
  dept: string
  days: number
  progress: number
  status: 'on-track' | 'at-risk' | 'completed'
  avatar: string
}

const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Marcus Reed',   role: 'Senior Product Designer', dept: 'Product',     days: 8,  progress: 24,  status: 'on-track',  avatar: 'https://i.pravatar.cc/150?u=marcus' },
  { id: '2', name: 'Priya Mehta',   role: 'Frontend Engineer',        dept: 'Engineering', days: 42, progress: 68,  status: 'at-risk',   avatar: 'https://i.pravatar.cc/150?u=priya'  },
  { id: '3', name: 'Sarah Kim',     role: 'HR Operations',            dept: 'People',      days: 28, progress: 92,  status: 'on-track',  avatar: 'https://i.pravatar.cc/150?u=sarah'  },
  { id: '4', name: 'James Wilson',  role: 'Sales Account Exec',       dept: 'Sales',       days: 90, progress: 100, status: 'completed', avatar: 'https://i.pravatar.cc/150?u=james'  },
]

function exportListCSV(employees: Employee[]) {
  const rows = [
    ['Name', 'Role', 'Department', 'Days', 'Progress', 'Status'],
    ...employees.map(e => [e.name, e.role, e.dept, String(e.days), `${e.progress}%`, e.status]),
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `employee-list-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface EmployeeTableProps {
  onInviteNew?: () => void
}

export default function EmployeeTable({ onInviteNew }: EmployeeTableProps) {
  const router = useRouter()

  return (
    <div className="pro-max-card" style={{ padding: '0px', overflow: 'hidden' }}>
      <div className="db-card-hd" style={{ padding: '24px 24px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-users" style={{ color: 'var(--blue)' }} />
          <h3>All Employees on Onboarding</h3>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onInviteNew && (
            <button className="btn btn-primary btn-sm" onClick={onInviteNew}>
              <i className="fa-solid fa-user-plus" /> Invite
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={() => exportListCSV(MOCK_EMPLOYEES)}>
            <i className="fa-solid fa-download" /> Export List
          </button>
        </div>
      </div>
      <div className="db-card-bd" style={{ padding: 0 }}>
        <table className="emp-tbl">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Dept</th>
              <th>Stage</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_EMPLOYEES.map(e => (
              <tr key={e.id}>
                <td>
                  <div className="emp-cell">
                    <img src={e.avatar} alt={e.name} />
                    <div>
                      <strong>{e.name}</strong>
                      <span>{e.role}</span>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text2)' }}>{e.dept}</td>
                <td style={{ fontSize: '12px' }}>
                  {e.days < 7 ? 'Week 1' : e.days < 30 ? 'Week ' + Math.ceil(e.days / 7) : e.days < 60 ? 'Month 2' : 'Month 3'}
                  <br />
                  <span style={{ fontSize: '10px', color: 'var(--text3)' }}>Day {e.days}</span>
                </td>
                <td className="prog-cell">
                  <em>{e.progress}%</em>
                  <div className="pw">
                    <div
                      className={`pf ${e.status === 'at-risk' ? 'risk' : e.status === 'completed' ? 'done' : ''}`}
                      style={{ width: `${e.progress}%` }}
                    />
                  </div>
                </td>
                <td>
                  <span className={`sbadge ${e.status === 'on-track' ? 'on' : e.status === 'at-risk' ? 'risk' : 'done'}`}>
                    {e.status === 'on-track' ? 'On Track' : e.status === 'at-risk' ? 'At Risk' : 'Completed'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => router.push(`/hr/employees/${e.id}`)}
                  >
                    View journey
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
