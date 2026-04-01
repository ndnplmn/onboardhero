'use client'

interface Resource {
  id: string
  title: string
  type: string
  icon: string
}

const MOCK_RESOURCES: Resource[] = [
  { id: '1', title: 'Company Handbook', type: 'PDF Document', icon: 'fa-solid fa-book' },
  { id: '2', title: 'IT Setup Guide', type: 'Wiki Page', icon: 'fa-solid fa-laptop-code' },
  { id: '3', title: 'Benefits & Perks', type: 'HR Portal', icon: 'fa-solid fa-heart-pulse' },
  { id: '4', title: 'Brand Assets', type: 'Shared Drive', icon: 'fa-solid fa-palette' },
]

export default function ResourceHub() {
  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3><i className="fa-solid fa-folder-open" style={{ color: 'var(--cyan)', marginRight: '6px' }}></i> Resource Hub</h3>
      </div>
      <div className="db-card-bd">
        <div className="rh-grid">
          {MOCK_RESOURCES.map(res => (
            <div key={res.id} className="rh-card">
              <div className="rh-ico"><i className={res.icon}></i></div>
              <div className="rh-meta">
                <strong>{res.title}</strong>
                <span>{res.type}</span>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-outline btn-sm w-full mt-4">View All Resources</button>
      </div>
    </div>
  )
}
