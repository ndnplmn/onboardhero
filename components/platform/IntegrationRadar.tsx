'use client'

import React from 'react'

interface RadarData {
  label: string
  value: number // 0-100
  color: string
}

interface IntegrationRadarProps {
  data?: RadarData[]
}

const DEFAULT_DATA: RadarData[] = [
  { label: 'Social', value: 78, color: 'var(--cyan)' },
  { label: 'Technical', value: 65, color: 'var(--blue)' },
  { label: 'Culture', value: 92, color: 'var(--aqua)' },
  { label: 'Process', value: 84, color: 'var(--violet)' },
  { label: 'Feedback', value: 70, color: 'var(--pink)' },
]

export default function IntegrationRadar({ data = DEFAULT_DATA }: IntegrationRadarProps) {
  const size = 280
  const center = size / 2
  const radius = size * 0.35
  const angleStep = (Math.PI * 2) / data.length

  const getPoints = (factor: number) => {
    return data.map((d, i) => {
      const angle = i * angleStep - Math.PI / 2
      const r = (d.value / 100) * radius * factor
      const x = center + r * Math.cos(angle)
      const y = center + r * Math.sin(angle)
      return `${x},${y}`
    }).join(' ')
  }

  const axes = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2
    const x = center + radius * Math.cos(angle)
    const y = center + radius * Math.sin(angle)
    return { x, y, label: d.label }
  })

  return (
    <div className="pro-max-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-compass-drafting" style={{ color: 'var(--blue)' }}></i>
          <h3>Integration Velocity</h3>
        </div>
        <div className="badge-ai">Live Sensors</div>
      </div>

      <div className="radar-viz-box" style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
        <div className="radar-scanline-pro" />
        <svg width={size} height={size} className="radar-svg" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="radar-glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Radar Background Rings */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((f, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius * f}
              style={{ fill: 'none', stroke: 'var(--border)', strokeWidth: '1' }}
            />
          ))}

          {/* Axes */}
          {axes.map((axis, i) => (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={axis.x}
              y2={axis.y}
              style={{ stroke: 'var(--border)', strokeWidth: '1', strokeDasharray: '4 4' }}
            />
          ))}

          <polygon points={getPoints(1)} style={{ fill: 'rgba(0, 255, 242, 0.1)', stroke: 'var(--cyan)', strokeWidth: '2', strokeLinejoin: 'round' }} />
          <polygon points={getPoints(0.95)} style={{ fill: 'none', stroke: 'var(--cyan)', strokeWidth: '1', opacity: 0.5 }} filter="url(#radar-glow)" />

          {/* Labels */}
          {axes.map((axis, i) => {
            const angle = i * angleStep - Math.PI / 2
            const lx = center + (radius + 24) * Math.cos(angle)
            const ly = center + (radius + 24) * Math.sin(angle)
            return (
              <text key={i} x={lx} y={ly} style={{ fill: 'var(--text2)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', textAnchor: 'middle', dominantBaseline: 'middle' }}>
                {axis.label}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="radar-insights" style={{ marginTop: '16px', padding: '16px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: '1.5', fontWeight: '600' }}>
          <strong style={{ color: 'var(--blue)' }}>Insight:</strong> Social and Culture integration are peaking. Technical ramp-up remains stable.
        </p>
      </div>

      <style jsx>{`
        .radar-scanline-pro {
          position: absolute;
          width: 50%;
          height: 2px;
          background: linear-gradient(to right, transparent, var(--cyan));
          top: 50%;
          left: 50%;
          transform-origin: left center;
          animation: radar-sweep 4s linear infinite;
          opacity: 0.3;
          pointer-events: none;
        }
        @keyframes radar-sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
