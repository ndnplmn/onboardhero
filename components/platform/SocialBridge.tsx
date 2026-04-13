'use client'

const CONTACTS = [
  { name: 'Sarah Miller', role: 'Onboarding Buddy', status: 'online',  avatar: 'https://i.pravatar.cc/100?u=sarah' },
  { name: 'David Chen',   role: 'Manager',          status: 'offline', avatar: 'https://i.pravatar.cc/100?u=david' },
]

export default function SocialBridge() {
  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-comments" style={{ color: 'var(--aqua)' }} />
          Team Support
        </h3>
      </div>

      <div className="db-card-bd">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CONTACTS.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Avatar + online dot */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={c.avatar}
                  alt={c.name}
                  style={{
                    width: 42, height: 42,
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    display: 'block',
                  }}
                />
                <div
                  aria-label={c.status === 'online' ? 'Online' : 'Offline'}
                  style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 10, height: 10, borderRadius: '50%',
                    background: c.status === 'online' ? 'var(--green)' : 'var(--text3)',
                    border: '2px solid var(--surface)',
                    boxShadow: c.status === 'online' ? '0 0 8px var(--green)' : 'none',
                  }}
                />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {c.role} · <span style={{ color: c.status === 'online' ? 'var(--green)' : 'var(--text3)' }}>
                    {c.status === 'online' ? 'Available' : 'Away'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" title={`Message ${c.name} on Slack`} aria-label={`Message ${c.name} on Slack`}>
                  <i className="fa-brands fa-slack" aria-hidden="true" />
                </button>
                <button className="btn btn-ghost btn-sm" title={`Email ${c.name}`} aria-label={`Email ${c.name}`}>
                  <i className="fa-solid fa-envelope" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-outline btn-sm w-full mt-4" style={{ fontSize: 12 }}>
          <i className="fa-solid fa-users-viewfinder" style={{ marginRight: 6 }} />
          View Full Team
        </button>
      </div>
    </div>
  )
}
