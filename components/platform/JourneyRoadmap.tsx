'use client'

const STEPS = [
  { label: 'Week 1', desc: 'Orientation', status: 'done' },
  { label: 'Week 2', desc: 'Team Setup', status: 'done' },
  { label: 'Week 3', desc: 'First Tasks', status: 'current' },
  { label: 'Week 4', desc: 'Deeper Dive', status: 'pending' },
  { label: 'Month 2', desc: 'Ramp-up', status: 'pending' },
  { label: 'Month 3', desc: 'Full Productivity', status: 'pending' },
]

export default function JourneyRoadmap() {
  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3><i className="fa-solid fa-map-location-dot" style={{ color: 'var(--blue)', marginRight: '6px' }}></i> Your Onboarding Roadmap</h3>
      </div>
      <div className="db-card-bd">
        <div className="jr-track-wrap">
          <div className="jr-track">
            {STEPS.map((step, i) => (
              <div key={i} className={`jr-step ${step.status}`}>
                <div className="jr-dot">
                  {step.status === 'done' ? <i className="fa-solid fa-check"></i> : (i + 1)}
                </div>
                <div className="jr-meta">
                  <strong>{step.label}</strong>
                  <span>{step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
