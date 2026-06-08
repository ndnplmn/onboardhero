'use client'

export interface DeptStat {
  name: string
  velocity: number
  trend: 'up' | 'down' | 'stable'
  hires: number
}

interface TalentVelocityProps {
  deptStats?: DeptStat[]
}

const PILL_STYLES: Record<string, { background: string; color: string; border?: string }> = {
  up:     { background: 'var(--green-bg)', color: 'var(--green)' },
  down:   { background: 'var(--red-bg)',   color: 'var(--red)'   },
  stable: { background: 'var(--bg)',       color: 'var(--text3)', border: '1px solid var(--border)' },
}

const FILL_COLORS: Record<string, string> = {
  up:     'var(--grad)',
  down:   'var(--red)',
  stable: 'var(--blue)',
}

export default function TalentVelocity({ deptStats }: TalentVelocityProps) {
  return (
    <div className="db-card" style={{ padding: '24px', flex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-gauge-high" style={{ color: 'var(--blue)' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>Talent Velocity</h3>
        </div>
        <div className="badge-ai">90-Day Meta</div>
      </div>

      {!deptStats || deptStats.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)' }}>
          <i className="fa-solid fa-gauge" style={{ fontSize: 24, opacity: 0.3, display: 'block', marginBottom: 10 }} />
          <p style={{ fontSize: 12, fontWeight: 500 }}>No department data yet.</p>
          <p style={{ fontSize: 11, marginTop: 4 }}>Velocity will appear once hires complete tasks.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {deptStats.map(d => (
            <div key={d.name} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 60px', alignItems: 'center', gap: '16px' }}>
              {/* Label + value */}
              <div>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '2px' }}>
                  {d.name}
                </span>
                <strong style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text)' }}>{d.velocity}%</strong>
              </div>

              {/* Progress track */}
              <div style={{ height: '6px', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px' }} />
                <div style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0,
                  width: `${d.velocity}%`,
                  background: FILL_COLORS[d.trend],
                  borderRadius: '3px',
                  transition: 'width 1s ease-out',
                }} />
              </div>

              {/* Trend pill */}
              <div style={{
                fontSize: '9px', fontWeight: 900, padding: '4px 8px',
                borderRadius: '6px', textAlign: 'center', letterSpacing: '0.5px',
                ...PILL_STYLES[d.trend],
              }}>
                {d.trend === 'up' ? 'OPT' : d.trend === 'down' ? 'SYNC' : 'BASE'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
