'use client'

const BADGES = [
  { id: 'b1', icon: 'fa-solid fa-rocket',      label: 'First Launch', color: 'var(--cyan)',   active: true  },
  { id: 'b2', icon: 'fa-solid fa-handshake',   label: 'Buddy Coffee', color: 'var(--aqua)',   active: true  },
  { id: 'b3', icon: 'fa-solid fa-shield-halved',label: 'Security Pro', color: 'var(--blue)',  active: false },
  { id: 'b4', icon: 'fa-solid fa-code-branch', label: 'First PR',     color: 'var(--purple)', active: false },
]

const XP_CURRENT = 650
const XP_TOTAL   = 1000
const XP_LEVEL   = 2

export default function AchievementWall() {
  const xpPct = Math.round((XP_CURRENT / XP_TOTAL) * 100)

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-trophy" style={{ color: 'var(--amber)' }} />
          Achievement Board
        </h3>
        <span className="badge-ai">Level {XP_LEVEL}</span>
      </div>

      <div className="db-card-bd">
        {/* XP progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
            <span style={{ color: 'var(--text2)' }}>Progress to Level {XP_LEVEL + 1}</span>
            <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>
              {XP_CURRENT} <span style={{ fontWeight: 400 }}>/ {XP_TOTAL} XP</span>
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              width: `${xpPct}%`, height: '100%',
              background: 'var(--grad)',
              boxShadow: '0 0 10px var(--cyan)',
              borderRadius: 100,
              transition: 'width 0.6s var(--ease)',
            }} />
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {BADGES.map(b => (
            <div
              key={b.id}
              className={`badge-item ${b.active ? 'active' : 'locked'}`}
              title={b.active ? b.label : `${b.label} (locked)`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                opacity: b.active ? 1 : 0.35,
                filter: b.active ? 'none' : 'grayscale(1)',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: b.active ? `color-mix(in srgb, ${b.color} 15%, transparent)` : 'var(--surface2)',
                border: `1.5px solid ${b.active ? b.color : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: b.active ? b.color : 'var(--text3)',
                fontSize: 16,
              }}>
                <i className={b.icon} aria-hidden="true" />
              </div>
              <span style={{ fontSize: 10, textAlign: 'center', fontWeight: 600, color: 'var(--text2)', lineHeight: 1.3 }}>
                {b.label}
              </span>
            </div>
          ))}
        </div>

        {/* Unlock hint */}
        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 14, lineHeight: 1.5, textAlign: 'center' }}>
          <i className="fa-solid fa-lock" style={{ marginRight: 4 }} />
          {BADGES.filter(b => !b.active).length} badge{BADGES.filter(b => !b.active).length !== 1 ? 's' : ''} left to unlock
        </p>
      </div>
    </div>
  )
}
