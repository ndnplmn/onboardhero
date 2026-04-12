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
    <div className="db-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-list-check" style={{ color: 'var(--blue)' }} />
          <h3>Stage Pipeline</h3>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {stages.map((stage, i) => (
          <div key={i} style={{
            padding: '12px',
            background: 'var(--surface)',
            borderRadius: 'var(--r)',
            border: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--blue)', marginBottom: '4px' }}>
              {stage.count}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>
              {stage.label}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', opacity: 0.7 }}>
        Active employees across all onboarding stages
      </p>
    </div>
  )
}
