import React from 'react'

export default function CoachingHub() {
  const recommendations = [
    { id: 1, title: 'Leadership Brief: Liam Evans', desc: 'Pre-meeting prep for Day 45 sync.', trend: 'at-risk', icon: 'fa-solid fa-file-invoice' },
    { id: 2, title: 'Simulation: Radical Candor', desc: 'Practice role-play for performance feedback.', trend: 'training', icon: 'fa-solid fa-vr-cardboard' },
    { id: 3, title: 'Retention Strategy: High-Velocity', desc: 'Identified burnout risk in Dev team.', trend: 'strategy', icon: 'fa-solid fa-shield-heart' }
  ]

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', width: '100%' }}>
          <h3><i className="fa-solid fa-graduation-cap" style={{ color: 'var(--blue)', marginRight: '6px' }}></i> AI Coaching & Intelligence</h3>
          <span className="badge-ai">Proactive</span>
        </div>
      </div>
      <div className="db-card-bd" style={{ padding: '0' }}>
        <div className="ch-list">
          {recommendations.map((rec) => (
            <div key={rec.id} className="ch-item">
              <div className={`ch-ico ${rec.trend}`}>
                <i className={rec.icon}></i>
              </div>
              <div className="ch-info">
                <h4>{rec.title}</h4>
                <p>{rec.desc}</p>
              </div>
              <button className="ch-btn">
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="ch-footer">
          <button className="btn btn-outline btn-sm" style={{ width: '100%', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <i className="fa-solid fa-plus"></i> Request Custom Simulation
          </button>
        </div>
      </div>

      <style jsx>{`
        .ch-list { display: flex; flexDirection: column; }
        .ch-item { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          padding: 20px; 
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s;
          cursor: pointer;
        }
        .ch-item:hover { background: rgba(255, 255, 255, 0.02); }
        .ch-item:last-child { border-bottom: none; }

        .ch-ico { 
          width: 44px; 
          height: 44px; 
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 18px;
          flex-shrink: 0;
        }
        .ch-ico.at-risk { background: rgba(255, 107, 107, 0.1); color: var(--red); border: 1px solid rgba(255, 107, 107, 0.2); }
        .ch-ico.training { background: rgba(0, 255, 242, 0.1); color: var(--cyan); border: 1px solid rgba(0, 255, 242, 0.2); }
        .ch-ico.strategy { background: rgba(69, 133, 243, 0.1); color: var(--blue); border: 1px solid rgba(69, 133, 243, 0.2); }

        .ch-info h4 { font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 4px; }
        .ch-info p { font-size: 11px; color: var(--text3); font-weight: 600; }

        .ch-btn { background: none; border: none; color: rgba(255, 255, 255, 0.2); margin-left: auto; transition: all 0.2s; }
        .ch-item:hover .ch-btn { color: #fff; transform: translateX(4px); }

        .ch-footer { padding: 20px; }
      `}</style>
    </div>
  )
}
