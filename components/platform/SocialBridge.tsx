'use client'

import React from 'react'

export default function SocialBridge() {
  const contacts = [
    { name: 'Sarah Miller', role: 'Buddy', status: 'online', avatar: 'https://i.pravatar.cc/100?u=sarah' },
    { name: 'David Chen', role: 'Manager', status: 'offline', avatar: 'https://i.pravatar.cc/100?u=david' }
  ]

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3><i className="fa-solid fa-comments" style={{ color: 'var(--aqua)', marginRight: '6px' }}></i> Team Support</h3>
      </div>
      <div className="db-card-bd">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {contacts.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={c.avatar} 
                  alt={c.name} 
                  style={{ width: '42px', height: '42px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} 
                />
                <div style={{ 
                  position: 'absolute', 
                  bottom: '-2px', 
                  right: '-2px', 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '50%', 
                  background: c.status === 'online' ? 'var(--green)' : 'var(--text3)',
                  border: '2px solid var(--surface)',
                  boxShadow: c.status === 'online' ? '0 0 10px var(--green)' : 'none'
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{c.role}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-ghost btn-sm" title="Message on Slack">
                  <i className="fa-brands fa-slack"></i>
                </button>
                <button className="btn btn-ghost btn-sm" title="Email">
                  <i className="fa-solid fa-envelope"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-outline btn-sm w-full mt-4" style={{ fontSize: '12px' }}>
           <i className="fa-solid fa-users-viewfinder" style={{ marginRight: '6px' }}></i>
           View Full Team
        </button>
      </div>
    </div>
  )
}
