'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InterventionBrief from './InterventionBrief'

export interface DeptNode {
  id: string
  name: string
  friction: number // 0 to 1
  hires: number
  status: 'stable' | 'turbulence' | 'high-risk'
  day: number
  description: string
  intervention: string
}

const MOCK_DEPT_NODES: DeptNode[] = [
  { 
    id: 'd1', name: 'Engineering', friction: 0.65, hires: 12, status: 'turbulence', day: 42,
    description: 'Widespread stall in Technical Ramp-up phase. Integration velocity has dropped 14% this week.',
    intervention: 'Schedule Cross-functional Technical Sync; Deploy Aura Mentorship Protocol.'
  },
  { 
    id: 'd2', name: 'Product', friction: 0.15, hires: 8, status: 'stable', day: 15,
    description: 'High resonance. Hires are achieving "Speed to Value" 20% faster than benchmark.',
    intervention: 'Capture Best Practices for Global Playbook.'
  },
  { 
    id: 'd3', name: 'Sales', friction: 0.85, hires: 5, status: 'high-risk', day: 60,
    description: 'Critical disconnect in Culture Alignment. Multiple retention warning signals detected.',
    intervention: 'Initiate Executive Leadership Check-in; Social Bridge Reconstruction.'
  },
  { 
    id: 'd4', name: 'Operations', friction: 0.3, hires: 4, status: 'stable', day: 22,
    description: 'Stable integration. Standard trajectory maintained.',
    intervention: 'Passive monitoring continued.'
  }
]

export default function GlobalFrictionMap() {
  const [selectedDept, setSelectedDept] = useState<DeptNode | null>(null)

  return (
    <div className="pro-max-card" style={{ padding: '24px' }}>
      <div className="map-header">
        <h3>Organizational Neural Field</h3>
        <div className="map-legend">
          <span className="l-item"><i className="dot stable"></i> Stable</span>
          <span className="l-item"><i className="dot turbulence"></i> Turbulence</span>
          <span className="l-item"><i className="dot high-risk"></i> High Risk</span>
        </div>
      </div>

      <div className="neural-field" style={{ height: '300px' }}>
        <svg className="neural-svg" viewBox="0 0 800 300" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.1" />
              <stop offset="50%" stopColor="var(--blue)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--purple)" stopOpacity="0.1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <path d="M0,150 Q200,80 400,150 T800,150" fill="none" stroke="url(#streamGrad)" strokeWidth="30" strokeLinecap="round" className="journey-stream" />

          {MOCK_DEPT_NODES.map((dept, i) => {
            const x = 150 + i * 180
            const y = 150 + (dept.friction > 0.5 ? -40 : 30)
            
            return (
              <g key={dept.id} className={`dept-node-group ${dept.status}`} onClick={() => setSelectedDept(dept)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r="14" className={`node-pulse ${dept.status}`} filter="url(#glow)" />
                <circle cx={x} cy={y} r="6" className="node-core" />
                <text x={x} y={y + 28} textAnchor="middle" className="node-label">{dept.name}</text>
                <text x={x} y={y + 40} textAnchor="middle" className="node-sub">{dept.hires} Hires</text>
              </g>
            )
          })}
        </svg>
      </div>

      <AnimatePresence>
        {selectedDept && (
          <InterventionBrief 
            point={{
              id: selectedDept.id,
              type: selectedDept.status === 'high-risk' ? 'culture' : 'technical',
              label: `${selectedDept.name} Stagnation`,
              day: selectedDept.day,
              severity: selectedDept.status === 'high-risk' ? 'high' : 'medium',
              description: selectedDept.description,
              intervention: selectedDept.intervention
            }}
            onClose={() => setSelectedDept(null)}
          />
        )}
      </AnimatePresence>

      <style jsx>{`
        .map-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .map-header h3 { font-size: 15px; font-weight: 800; color: var(--text); }
        
        .map-legend { display: flex; gap: 16px; padding: 4px 12px; background: var(--bg); border-radius: 100px; border: 1px solid var(--border); }
        .l-item { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; color: var(--text2); }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.stable { background: var(--cyan); box-shadow: 0 0 8px var(--cyan); }
        .dot.turbulence { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
        .dot.high-risk { background: var(--red); box-shadow: 0 0 8px var(--red); }

        .journey-stream { stroke-dasharray: 1000; animation: flow 20s linear infinite; opacity: 0.6; }
        
        .node-pulse { fill: #fff; opacity: 0.3; }
        .node-pulse.stable { fill: var(--cyan); animation: pulseSafe 2.5s infinite; }
        .node-pulse.turbulence { fill: var(--amber); animation: pulseWarn 2s infinite; }
        .node-pulse.high-risk { fill: var(--red); animation: pulseDanger 1.5s infinite; }
        
        .node-core { fill: #fff; stroke: var(--bg); stroke-width: 2; }
        .node-label { fill: var(--text); font-size: 11px; font-weight: 700; }
        .node-sub { fill: var(--text3); font-size: 9px; font-weight: 600; text-transform: uppercase; }

        @keyframes flow { from { stroke-dashoffset: 2000; } to { stroke-dashoffset: 0; } }
        @keyframes pulseSafe { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes pulseWarn { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.8); opacity: 0; } }
        @keyframes pulseDanger { 0% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(3.2); opacity: 0.3; } 100% { transform: scale(1); opacity: 0.7; } }
      `}</style>
    </div>
  )
}
