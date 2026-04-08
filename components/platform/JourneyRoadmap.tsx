'use client'

import React from 'react'

interface JourneyRoadmapProps {
  mutations?: any[]
  currentWeek?: number
}

const BASE_STEPS = [
  { label: 'Week 1', desc: 'Orientation', week: 1 },
  { label: 'Week 2', desc: 'Team Setup', week: 2 },
  { label: 'Week 3', desc: 'First Tasks', week: 3 },
  { label: 'Week 4', desc: 'Deeper Dive', week: 4 },
  { label: 'Month 2', desc: 'Ramp-up', week: 8 },
  { label: 'Month 3', desc: 'Full Productivity', week: 12 },
]

export default function JourneyRoadmap({ mutations = [], currentWeek = 3 }: JourneyRoadmapProps) {
  // Merge base steps with AI mutations
  const allSteps = [...BASE_STEPS]
  
  mutations.forEach(m => {
    if (m.type === 'ADD_TASK' && m.taskTitle) {
      // Find where to inject based on relevance or just add highlight
      allSteps.push({ 
        label: 'AI Suggestion', 
        desc: m.taskTitle, 
        week: currentWeek,
        isAI: true 
      } as any)
    }
  })

  // Sort by week
  const sortedSteps = allSteps.sort((a: any, b: any) => a.week - b.week)

  return (
    <div className="pro-max-card" style={{ padding: '30px' }}>
      <div className="jr-header-pro">
        <div className="jr-title-flex">
          <div className="jr-icon-brain"><i className="fa-solid fa-route" /></div>
          <div className="jr-labels">
            <h3>Neural Journey Stream</h3>
            <span>Adaptive Synchronized Path</span>
          </div>
        </div>
        {mutations.length > 0 && (
          <div className="badge-ai" style={{ background: 'var(--cyan)', color: '#fff', border: 'none' }}>
             <i className="fa-solid fa-sparkles" style={{ marginRight: '6px' }} />
             <span>AI RE-OPTIMIZED</span>
          </div>
        )}
      </div>

      <div className="jr-stream-viz">
        <svg viewBox="0 0 1000 140" className="jr-svg">
          <defs>
             <filter id="jr-liquid-blur">
               <feGaussianBlur stdDeviation="8" result="blur" />
             </filter>
             <linearGradient id="jr-flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
               <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.1" />
               <stop offset="50%" stopColor="var(--cyan)" stopOpacity="0.4" />
               <stop offset="100%" stopColor="var(--blue)" stopOpacity="0.1" />
             </linearGradient>
          </defs>

          <path d="M 50 70 C 200 70, 300 40,  500 70 C 700 100, 850 70, 950 70" className="jr-path-liquid-bg" filter="url(#jr-liquid-blur)" />
          <path d="M 50 70 C 200 70, 300 40,  500 70 C 700 100, 850 70, 950 70" className="jr-path-stream" />

          {sortedSteps.map((step: any, i) => {
            const x = 50 + (i * (900 / (sortedSteps.length - 1)))
            const y = 70 + (Math.sin((x / 1000) * Math.PI * 2) * 15)
            const status = step.week < currentWeek ? 'done' : step.week === currentWeek ? 'current' : 'pending'
            
            return (
              <g key={i} className={`jr-node-group ${status} ${step.isAI ? 'is-ai' : ''}`}>
                <circle cx={x} cy={y} r="18" className="jr-node-glow" />
                <circle cx={x} cy={y} r={step.isAI ? "12" : "8"} className="jr-node-core" />
                
                {step.isAI && (
                   <path d={`M ${x-5} ${y-5} L ${x+5} ${y+5} M ${x+5} ${y-5} L ${x-5} ${y+5}`} className="jr-ai-cross" />
                )}

                {!step.isAI && status === 'done' && (
                  <path d={`M ${x-3} ${y} L ${x-1} ${y+2} L ${x+3} ${y-2}`} className="jr-check" />
                )}

                <foreignObject x={x - 60} y={y > 70 ? y + 22 : y - 62} width="120" height="50">
                   <div className="jr-node-meta-pro">
                      <strong>{step.label}</strong>
                      <span>{step.desc}</span>
                   </div>
                </foreignObject>
              </g>
            )
          })}
        </svg>
      </div>

      <style jsx>{`
        .jr-header-pro { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .jr-title-flex { display: flex; gap: 12px; align-items: center; }
        .jr-icon-brain { 
          width: 40px; height: 40px; background: var(--cyan-light); 
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          color: var(--cyan); font-size: 1.1rem; border: 1px solid var(--cyan-mid);
        }
        .jr-labels h3 { font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 2px; }
        .jr-labels span { font-size: 10px; color: var(--text3); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        .jr-stream-viz { position: relative; margin: 30px 0; }
        .jr-svg { width: 100%; height: auto; overflow: visible; }

        .jr-path-liquid-bg { fill: none; stroke: var(--cyan); stroke-width: 20; stroke-linecap: round; opacity: 0.1; }
        .jr-path-stream { 
          fill: none; stroke: url(#jr-flow-grad); stroke-width: 3; stroke-linecap: round;
          stroke-dasharray: 10, 8; animation: flow-stream 15s linear infinite;
        }

        .jr-node-group { cursor: pointer; }
        .jr-node-core { fill: var(--surface); stroke: var(--border); stroke-width: 2; transition: all 0.3s; }
        .jr-node-glow { fill: var(--cyan); opacity: 0; transition: all 0.3s; filter: blur(10px); }

        .jr-node-group.done .jr-node-core { fill: var(--cyan); stroke: var(--cyan); }
        .jr-node-group.current .jr-node-core { stroke: var(--cyan); stroke-width: 4; fill: #fff; }
        .jr-node-group.is-ai .jr-node-core { fill: var(--cyan); stroke: var(--cyan); transform: rotate(45deg); }

        .jr-node-group:hover .jr-node-glow { opacity: 0.4; }
        .jr-node-group:hover .jr-node-core { transform: scale(1.2); border-color: var(--cyan); }

        .jr-check, .jr-ai-cross { fill: none; stroke: #fff; stroke-width: 2.5; stroke-linecap: round; pointer-events: none; }

        .jr-node-meta-pro { text-align: center; }
        .jr-node-meta-pro strong { display: block; font-size: 11px; font-weight: 800; color: var(--text); margin-bottom: 1px; }
        .jr-node-meta-pro span { font-size: 10px; color: var(--text3); font-weight: 600; }

        @keyframes flow-stream { from { stroke-dashoffset: 500; } to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  )
}
