'use client'

interface RadarData {
  label: string
  value: number // 0-100
}

interface IntegrationRadarProps {
  data?: RadarData[]
}

const DEFAULT_DATA: RadarData[] = [
  { label: 'Social',    value: 78 },
  { label: 'Technical', value: 65 },
  { label: 'Culture',   value: 92 },
  { label: 'Process',   value: 84 },
  { label: 'Feedback',  value: 70 },
]

export default function IntegrationRadar({ data = DEFAULT_DATA }: IntegrationRadarProps) {
  const size = 260
  const center = size / 2
  const radius = size * 0.35
  const angleStep = (Math.PI * 2) / data.length

  const getPoints = (factor: number) =>
    data.map((d, i) => {
      const angle = i * angleStep - Math.PI / 2
      const r = (d.value / 100) * radius * factor
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
    }).join(' ')

  const axes = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      lx: center + (radius + 24) * Math.cos(angle),
      ly: center + (radius + 24) * Math.sin(angle),
      label: d.label,
      value: d.value,
    }
  })

  const topDimension = [...data].sort((a, b) => b.value - a.value)[0]

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-compass-drafting" style={{ color: 'var(--blue)' }} />
          Integration Velocity
        </h3>
        <span className="badge-ai">
          <i className="fa-solid fa-signal" style={{ marginRight: 3 }} />
          Live Sensors
        </span>
      </div>

      <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Radar chart */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div className="radar-scanline-pro" />
          <svg width={size} height={size} style={{ overflow: 'visible' }} aria-label="Integration velocity radar chart">
            <defs>
              <filter id="radar-glow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Rings */}
            {[0.2, 0.4, 0.6, 0.8, 1].map((f, i) => (
              <circle key={i} cx={center} cy={center} r={radius * f}
                fill="none" stroke="var(--border)" strokeWidth="1" />
            ))}

            {/* Axes */}
            {axes.map((axis, i) => (
              <line key={i} x1={center} y1={center} x2={axis.x} y2={axis.y}
                stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
            ))}

            {/* Data polygon */}
            <polygon points={getPoints(1)}
              fill="rgba(0,200,224,0.1)" stroke="var(--cyan)" strokeWidth="2" strokeLinejoin="round" />
            <polygon points={getPoints(0.95)}
              fill="none" stroke="var(--cyan)" strokeWidth="1" opacity={0.5} filter="url(#radar-glow)" />

            {/* Labels */}
            {axes.map((axis, i) => (
              <text key={i} x={axis.lx} y={axis.ly}
                fill="var(--text2)" fontSize="10" fontWeight="800"
                textAnchor="middle" dominantBaseline="middle"
                style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                {axis.label}
              </text>
            ))}
          </svg>
        </div>

        {/* Mini score bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map((d) => (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', width: 62, flexShrink: 0 }}>
                {d.label}
              </span>
              <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${d.value}%`,
                  background: d.value >= 80 ? 'var(--grad)' : d.value >= 60 ? 'var(--blue)' : 'var(--amber)',
                  borderRadius: 100,
                  transition: 'width 0.6s var(--ease)',
                }} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: d.value >= 80 ? 'var(--cyan)' : d.value >= 60 ? 'var(--blue)' : 'var(--amber)',
                width: 28, textAlign: 'right', flexShrink: 0,
                fontFamily: 'var(--font-display)',
              }}>
                {d.value}
              </span>
            </div>
          ))}
        </div>

        {/* Insight */}
        <div style={{
          background: 'var(--bg)', borderRadius: 'var(--r)',
          border: '1px solid var(--border)', padding: '12px 14px',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, fontWeight: 600, margin: 0 }}>
            <i className="fa-solid fa-sparkles" style={{
              marginRight: 6, fontSize: 10,
              background: 'var(--grad)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }} />
            <strong style={{ color: 'var(--blue)' }}>Top: </strong>
            {topDimension.label} is your strongest dimension at {topDimension.value}%.
          </p>
        </div>
      </div>
    </div>
  )
}
