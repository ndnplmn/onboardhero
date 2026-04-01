'use client'

const MILESTONES = [
  { label: 'Connect', desc: 'Pre-boarding & Day 1', day: 'D1', status: 'done' },
  { label: 'Orient', desc: 'Context & Culture', day: 'W1', status: 'done' },
  { label: 'Commence', desc: 'Job-specific basics', day: 'W2', status: 'done' },
  { label: 'Integrate', desc: 'First Projects', day: 'M1', status: 'current' },
  { label: 'Perform', desc: 'Full Productivity', day: 'M3', status: 'pending' },
]

export default function JourneyTemplate() {
  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>Standard 90-Day Journey Template</h3>
        <button className="btn btn-ghost btn-sm">Edit Template</button>
      </div>
      <div className="db-card-bd">
        <div className="jt-track-wrap">
          <div className="jt-track">
            {MILESTONES.map((m, i) => (
              <div key={i} className={`jt-node ${m.status}`}>
                <div className="jt-dot">
                  {m.status === 'done' ? <i className="fa-solid fa-check"></i> : m.day}
                </div>
                <div className="jt-label">
                  <strong>{m.label}</strong>
                  <span>{m.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
