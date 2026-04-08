'use client'

import React from 'react'

export interface FrictionPoint {
  id: string
  type: 'technical' | 'culture' | 'engagement' | 'role_clarity' | 'mentorship'
  severity: 'low' | 'medium' | 'high'
  label: string
  description: string
  day: number
  intervention: string
}

interface FrictionMapProps {
  points: FrictionPoint[]
  startDate: string
}

export default function FrictionMap({ points, startDate }: FrictionMapProps) {
  // Normalize days to 0-100% of the 90-day journey
  const getX = (day: number) => (day / 90) * 100

  return (
    <div className="pro-max-card" style={{ padding: '30px' }}>
      <div className="fm-header">
        <div className="fm-title">
          <h3>Neural Friction Field</h3>
          <span>Volumetric Journey Audit (2026 Pro Max)</span>
        </div>
        <div className="fm-legend">
          <span className="l-item"><i className="dot low"></i> Stable</span>
          <span className="l-item"><i className="dot medium"></i> Turbulence</span>
          <span className="l-item"><i className="dot high"></i> High Risk</span>
        </div>
      </div>

      <div className="fm-viz">
        <svg viewBox="0 0 1000 160" className="fm-svg">
          <defs>
            <filter id="glow-max">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="ribbon-blur">
              <feGaussianBlur stdDeviation="8" result="blur" />
            </filter>
            <linearGradient id="neural-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.8" />
              <stop offset="50%" stopColor="var(--blue)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Volumetric Neural Dust */}
          {[...Array(15)].map((_, i) => (
             <circle 
               key={i} 
               cx={Math.random() * 1000} 
               cy={Math.random() * 160} 
               r={1.5} 
               className="neural-particle"
               style={{ animationDelay: `${Math.random() * 5}s` }}
             />
          ))}

          <path d="M 0 80 Q 250 120, 500 80 T 1000 80" className="fm-ribbon-base" />
          <path d="M 0 80 Q 250 120, 500 80 T 1000 80" className="fm-ribbon-glow" filter="url(#ribbon-blur)" />
          <path d="M 0 80 Q 250 120, 500 80 T 1000 80" className="fm-pulse-core" />

          {points.map((p) => {
            const x = getX(p.day) * 10
            return (
              <g key={p.id} className={`fm-point-group-max ${p.severity}`}>
                <circle cx={x} cy="80" r="18" className="fm-shockwave" />
                <circle cx={x} cy="80" r="10" className="fm-point-aura" filter="url(#glow-max)" />
                <circle cx={x} cy="80" r="5" className="fm-point-nucleus" />
                
                <foreignObject x={x - 60} y="105" width="120" height="50">
                  <div className="fm-point-label-max">
                    <strong>{p.label}</strong>
                    <span>Day {p.day}</span>
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </svg>

        <div className="fm-markers-max">
          <span>Arrival</span>
          <span>Day 30</span>
          <span>Day 60</span>
          <span>Phase Complete</span>
        </div>
      </div>

      <style jsx>{`
        .fm-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
        .fm-title h3 { font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 4px; }
        .fm-title span { font-size: 11px; color: var(--text3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .fm-legend { display: flex; gap: 16px; padding: 4px 12px; background: var(--bg); border-radius: 100px; border: 1px solid var(--border); }
        .l-item { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; color: var(--text2); }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.low { background: var(--cyan); box-shadow: 0 0 8px var(--cyan); }
        .dot.medium { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
        .dot.high { background: var(--red); box-shadow: 0 0 8px var(--red); }

        .fm-viz { position: relative; }
        .fm-svg { width: 100%; height: auto; overflow: visible; }
        
        .fm-ribbon-base { fill: none; stroke: var(--border); stroke-width: 8; stroke-linecap: round; opacity: 0.5; }
        .fm-ribbon-glow { fill: none; stroke: var(--cyan); stroke-width: 12; stroke-linecap: round; opacity: 0.15; }
        .fm-pulse-core { fill: none; stroke: url(#neural-grad); stroke-width: 2; stroke-linecap: round; stroke-dasharray: 15, 15; animation: flow 10s linear infinite; }

        .neural-particle { fill: var(--cyan); opacity: 0.3; animation: float 4s ease-in-out infinite; }

        .fm-point-group-max { cursor: pointer; }
        .fm-point-nucleus { fill: #fff; stroke: var(--bg); stroke-width: 2.5; transition: all 0.3s; }
        .fm-point-aura { fill: var(--cyan); transition: all 0.3s; opacity: 0.8; }
        .fm-shockwave { fill: none; stroke: var(--cyan); stroke-width: 1; opacity: 0; transform-origin: center; }

        .fm-point-group-max:hover .fm-shockwave { animation: shockwave 0.8s ease-out forwards; }
        .fm-point-group-max:hover .fm-point-nucleus { transform: scale(1.3); }

        .high .fm-point-aura { fill: var(--red); }
        .high .fm-shockwave { stroke: var(--red); }
        .medium .fm-point-aura { fill: var(--amber); }
        .medium .fm-shockwave { stroke: var(--amber); }

        .fm-point-label-max { text-align: center; transition: all 0.3s; }
        .fm-point-label-max strong { display: block; font-size: 11px; font-weight: 700; color: var(--text); }
        .fm-point-label-max span { font-size: 10px; color: var(--text3); font-weight: 600; text-transform: uppercase; }
        
        .fm-point-group-max:hover .fm-point-label-max { transform: translateY(2px); }

        .fm-markers-max { display: flex; justify-content: space-between; margin-top: 20px; border-top: 1px solid var(--border); padding-top: 12px; }
        .fm-markers-max span { font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; }

        @keyframes flow { to { stroke-dashoffset: -300; } }
        @keyframes float { 0%, 100% { transform: translateY(0); opacity: 0.3; } 50% { transform: translateY(-10px); opacity: 0.5; } }
        @keyframes shockwave { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(3.5); opacity: 0; } }
      `}</style>
    </div>
  )
}
