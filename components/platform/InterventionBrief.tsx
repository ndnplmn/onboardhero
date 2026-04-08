import React from 'react'
import type { FrictionPoint } from './FrictionMap'

interface InterventionBriefProps {
  point: FrictionPoint
  onClose: () => void
}

export default function InterventionBrief({ point, onClose }: InterventionBriefProps) {
  const ico: Record<string, string> = {
    technical: 'fa-solid fa-microchip',
    culture: 'fa-solid fa-users',
    engagement: 'fa-solid fa-bolt',
    role_clarity: 'fa-solid fa-compass',
    mentorship: 'fa-solid fa-handshake-angle'
  }

  return (
    <div className="ib-overlay" onClick={onClose}>
      <div className="ib-modal" onClick={e => e.stopPropagation()}>
        <div className="ib-header">
          <div className={`ib-ico ${point.type}`}>
            <i className={ico[point.type]}></i>
          </div>
          <div className="ib-title">
            <h3>{point.label}</h3>
            <span>Detected on Day {point.day} • {point.severity} severity</span>
          </div>
          <button className="ib-close" onClick={onClose}>&times;</button>
        </div>

        <div className="ib-body">
          <section>
            <h4>Analysis</h4>
            <p>{point.description}</p>
          </section>

          <section className="ib-actionable">
            <h4>AI Recommended Intervention</h4>
            <div className="ib-brief-box">
              <i className="fa-solid fa-lightbulb"></i>
              <p>{point.intervention}</p>
            </div>
          </section>

          <div className="ib-footer">
            <button className="btn-secondary" onClick={onClose}>Dismiss</button>
            <button className="btn-primary">Execute Action</button>
          </div>
        </div>
      </div>      <style jsx>{`
        .ib-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 15, 30, 0.4);
          backdrop-filter: blur(20px) saturate(180%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .ib-modal {
          width: 100%;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.5);
          overflow: hidden;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ib-header {
          padding: 30px;
          display: flex;
          align-items: center;
          gap: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
        }
        .ib-ico { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
        .ib-ico.technical { background: var(--blue); }
        .ib-ico.culture { background: var(--cyan); }
        .ib-ico.engagement { background: var(--amber); }
        .ib-ico.role_clarity { background: var(--indigo); }
        .ib-ico.mentorship { background: var(--green); }
        
        .ib-title h3 { font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 4px; letter-spacing: -0.02em; }
        .ib-title span { font-size: 11px; color: var(--cyan); font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; }
        
        .ib-close { position: absolute; top: 24px; right: 28px; background: none; border: none; font-size: 28px; cursor: pointer; color: rgba(255,255,255,0.4); transition: all 0.2s; }
        .ib-close:hover { color: #fff; transform: rotate(90deg); }

        .ib-body { padding: 30px; }
        .ib-body section { margin-bottom: 30px; }
        .ib-body h4 { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: var(--cyan); margin-bottom: 14px; opacity: 0.6; }
        .ib-body p { font-size: 15px; line-height: 1.7; color: rgba(255, 255, 255, 0.8); font-weight: 500; }

        .ib-actionable { 
          background: rgba(0, 255, 242, 0.03); 
          padding: 24px; 
          border-radius: 20px; 
          border: 1px solid rgba(0, 255, 242, 0.1);
          position: relative;
          overflow: hidden;
        }
        .ib-actionable::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 4px; height: 100%;
          background: var(--cyan);
        }
        .ib-brief-box { display: flex; gap: 16px; }
        .ib-brief-box i { font-size: 18px; color: var(--cyan); margin-top: 4px; }
        .ib-brief-box p { color: #fff; font-weight: 700; font-size: 14px; }

        .ib-footer { display: flex; gap: 16px; margin-top: 10px; }
        .ib-footer button { flex: 1; height: 52px; border-radius: 16px; font-size: 14px; font-weight: 800; cursor: pointer; border: none; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .btn-secondary { background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1) !important; }
        .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); }
        .btn-primary { background: var(--grad); color: #fff; box-shadow: 0 8px 30px rgba(0, 255, 242, 0.3); }
        .btn-primary:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0, 255, 242, 0.4); }

      `}</style>
    </div>
  )
}
