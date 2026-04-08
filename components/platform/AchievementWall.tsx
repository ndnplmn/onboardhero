'use client'

import React from 'react'

export default function AchievementWall() {
  const badges = [
    { id: 'b1', icon: 'fa-solid fa-rocket', label: 'First Launch', color: 'var(--cyan)', active: true },
    { id: 'b2', icon: 'fa-solid fa-handshake', label: 'Buddy Coffee', color: 'var(--aqua)', active: true },
    { id: 'b3', icon: 'fa-solid fa-shield-halved', label: 'Security Pro', color: 'var(--blue)', active: false },
    { id: 'b4', icon: 'fa-solid fa-code-branch', label: 'First PR', color: 'var(--purple)', active: false },
  ]

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h3><i className="fa-solid fa-trophy" style={{ color: 'var(--amber)', marginRight: '6px' }}></i> Achievement Board</h3>
          <span className="badge-ai" style={{ fontSize: '10px' }}>Level 2</span>
        </div>
      </div>
      <div className="db-card-bd">
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', fontWeight: 600 }}>
            <span>Progress to Level 3</span>
            <span>650 / 1000 XP</span>
          </div>
          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: '65%', height: '100%', background: 'var(--grad)', boxShadow: '0 0 10px var(--cyan)' }}></div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {badges.map(b => (
            <div 
              key={b.id} 
              className={`badge-item ${b.active ? 'active' : 'locked'}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                opacity: b.active ? 1 : 0.3,
                filter: b.active ? 'none' : 'grayscale(1)',
                transition: 'transform 0.3s'
              }}
            >
              <div 
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '12px', 
                  background: b.active ? `${b.color}20` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${b.active ? b.color : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: b.active ? b.color : 'inherit'
                }}
              >
                <i className={b.icon}></i>
              </div>
              <span style={{ fontSize: '10px', textAlign: 'center', fontWeight: 600 }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .badge-item:hover { transform: translateY(-3px); }
        .locked { cursor: not-allowed; }
      `}</style>
    </div>
  )
}
