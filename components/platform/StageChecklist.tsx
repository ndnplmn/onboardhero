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
    <div className="pro-max-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-list-check" style={{ color: 'var(--blue)' }}></i>
          <h3>Onboarding Stage Summary</h3>
        </div>
      </div>
      <div className="db-card-bd" style={{ padding: '0px' }}>
        <div className="stage-summary" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {stages.map((stage, i) => (
            <div key={i} className="ss-item-pro" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div className="ss-num" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--blue)', marginBottom: '4px' }}>{stage.count}</div>
              <div className="ss-label" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{stage.label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', opacity: 0.7 }}>
          * Currently active employees across these stages.
        </p>
      </div>
    </div>
  )
}
