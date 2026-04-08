'use client'

import { useRouter } from 'next/navigation'

const RECOMMENDATIONS = [
  {
    id: 1,
    title: 'Leadership Brief: Liam Evans',
    desc: 'Pre-meeting prep for Day 45 sync.',
    trend: 'at-risk',
    icon: 'fa-solid fa-file-invoice',
    href: '/manager/coaching',
    color: 'var(--red)',
    bg: 'var(--red-bg)',
    border: 'rgba(239,68,68,0.2)',
  },
  {
    id: 2,
    title: 'Simulation: Radical Candor',
    desc: 'Practice role-play for performance feedback.',
    trend: 'training',
    icon: 'fa-solid fa-vr-cardboard',
    href: '/manager/coaching',
    color: 'var(--cyan)',
    bg: 'var(--cyan-light)',
    border: 'rgba(0,200,224,0.2)',
  },
  {
    id: 3,
    title: 'Retention Strategy: Dev Team',
    desc: 'Identified burnout risk. Action recommended.',
    trend: 'strategy',
    icon: 'fa-solid fa-shield-heart',
    href: '/manager/coaching',
    color: 'var(--blue)',
    bg: 'var(--blue-light)',
    border: 'rgba(26,108,246,0.2)',
  },
]

export default function CoachingHub() {
  const router = useRouter()

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-graduation-cap" style={{ color: 'var(--blue)' }} />
          {' '}AI Coaching & Intelligence
        </h3>
        <span className="badge-ai">Proactive</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {RECOMMENDATIONS.map((rec, i) => (
          <button
            key={rec.id}
            onClick={() => router.push(rec.href)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '18px 20px',
              borderBottom: i < RECOMMENDATIONS.length - 1 ? '1px solid var(--border)' : 'none',
              background: 'transparent',
              border: 'none',
              borderBottomColor: 'var(--border)',
              borderBottomStyle: i < RECOMMENDATIONS.length - 1 ? 'solid' : undefined,
              borderBottomWidth: i < RECOMMENDATIONS.length - 1 ? 1 : 0,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
              width: '100%',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--r)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
              background: rec.bg,
              color: rec.color,
              border: `1px solid ${rec.border}`,
            }}>
              <i className={rec.icon} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {rec.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
                {rec.desc}
              </div>
            </div>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }} />
          </button>
        ))}
      </div>

      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
        <button
          className="btn btn-outline btn-sm"
          style={{ width: '100%' }}
          onClick={() => router.push('/manager/coaching')}
        >
          <i className="fa-solid fa-plus" /> Request Custom Simulation
        </button>
      </div>
    </div>
  )
}
