'use client'

interface Stage {
  label: string
  count: number
}

interface StageChecklistProps {
  stages: Stage[]
}

export default function StageChecklist({ stages }: StageChecklistProps) {
  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3><i className="fa-solid fa-list-check" style={{ color: 'var(--amber)', marginRight: '6px' }}></i> Onboarding Stage Summary</h3>
      </div>
      <div className="db-card-bd">
        <div className="stage-summary">
          {stages.map((stage, i) => (
            <div key={i} className="ss-item">
              <div className="ss-num">{stage.count}</div>
              <div className="ss-label">{stage.label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center' }}>
          * Currently active employees across these stages.
        </p>
      </div>
    </div>
  )
}
