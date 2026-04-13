interface ContactCardProps {
  name:       string
  role:       string
  avatarUrl?: string | null
  id:         string
}

export default function ContactCard({ name, role, avatarUrl, id }: ContactCardProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img
        src={avatarUrl || `https://i.pravatar.cc/32?u=${id}`}
        alt={`${name}'s avatar`}
        style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--border)' }}
      />
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </strong>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{role}</span>
      </div>
    </div>
  )
}
