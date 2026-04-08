'use client'

import React from 'react'

export default function TalentVelocity() {
  const depts = [
    { name: 'Engineering', velocity: 78, trend: 'stable' },
    { name: 'Product', velocity: 92, trend: 'up' },
    { name: 'Sales', velocity: 64, trend: 'down' },
    { name: 'Design', velocity: 85, trend: 'up' },
  ]

  return (
    <div className="pro-max-card talent-velocity-card" style={{ padding: '24px' }}>
      <div className="vel-header">
        <div className="vel-title">
          <i className="fa-solid fa-gauge-high" style={{ color: 'var(--blue)' }}></i>
          <h3>Talent Velocity</h3>
        </div>
        <div className="badge-ai">90-Day Meta</div>
      </div>

      <div className="vel-list">
        {depts.map(d => (
          <div key={d.name} className="vel-row">
            <div className="row-info">
              <span>{d.name}</span>
              <strong>{d.velocity}%</strong>
            </div>
            <div className="row-track">
              <div className="row-bg"></div>
              <div 
                className={`row-fill ${d.trend}`} 
                style={{ width: `${d.velocity}%` }}
              ></div>
            </div>
            <div className={`row-trend-pill ${d.trend}`}>
              {d.trend === 'up' ? 'OPT' : d.trend === 'down' ? 'SYNC' : 'BASE'}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .vel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .vel-title { display: flex; align-items: center; gap: 10px; }
        .vel-title h3 { font-size: 15px; font-weight: 800; color: var(--text); }

        .vel-list { display: flex; flex-direction: column; gap: 20px; }
        .vel-row { display: grid; grid-template-columns: 100px 1fr 60px; align-items: center; gap: 16px; }
        
        .row-info span { display: block; font-size: 10px; font-weight: 700; color: var(--text3); margin-bottom: 2px; text-transform: uppercase; }
        .row-info strong { font-size: 15px; font-weight: 900; color: var(--text); }

        .row-track { height: 6px; position: relative; }
        .row-bg { position: absolute; inset: 0; background: var(--bg); border: 1px solid var(--border); border-radius: 3px; }
        .row-fill { position: absolute; top:0; left:0; bottom:0; border-radius: 3px; transition: width 1s ease-out; }
        .row-fill.up { background: var(--grad); box-shadow: 0 0 10px rgba(0,255,242,0.2); }
        .row-fill.down { background: var(--red); }
        .row-fill.stable { background: var(--blue); }

        .row-trend-pill { font-size: 9px; font-weight: 900; padding: 4px 8px; border-radius: 6px; text-align: center; letter-spacing: 0.5px; }
        .row-trend-pill.up { background: var(--green-light); color: var(--green); }
        .row-trend-pill.down { background: var(--red-light); color: var(--red); }
        .row-trend-pill.stable { background: var(--bg); color: var(--text3); border: 1px solid var(--border); }
      `}</style>
    </div>
  )
}
