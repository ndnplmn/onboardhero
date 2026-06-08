'use client'

interface Stage {
  label: string
  count: number
}

interface StageChecklistProps {
  stages: Stage[]
  activeStage?: string
  onStageClick?: (stageLabel: string) => void
}

export default function StageChecklist({ stages, activeStage, onStageClick }: StageChecklistProps) {
  return (
    <div className="db-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-list-check" style={{ color: 'var(--blue)' }} />
          <h3>Stage Pipeline</h3>
        </div>
        {activeStage && onStageClick && (
          <button
            onClick={() => onStageClick('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text3)', padding: '2px 6px' }}
          >
            Clear filter ×
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {stages.map((stage, i) => {
          const isActive = activeStage === stage.label
          return (
            <div
              key={i}
              onClick={() => onStageClick?.(isActive ? '' : stage.label)}
              style={{
                padding: '12px',
                background: isActive ? 'var(--blue-light, rgba(59,130,246,0.1))' : 'var(--surface)',
                borderRadius: 'var(--r)',
                border: isActive ? '1.5px solid var(--blue)' : '1px solid var(--border)',
                textAlign: 'center',
                cursor: onStageClick ? 'pointer' : 'default',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 800, color: isActive ? 'var(--blue)' : 'var(--blue)', marginBottom: '4px' }}>
                {stage.count}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: isActive ? 'var(--blue)' : 'var(--text3)', textTransform: 'uppercase' }}>
                {stage.label}
              </div>
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', opacity: 0.7 }}>
        {onStageClick ? 'Click a stage to filter employees' : 'Active employees across all onboarding stages'}
      </p>
    </div>
  )
}
