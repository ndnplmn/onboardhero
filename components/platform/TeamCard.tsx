import RiskBadge from './RiskBadge'
import Link from 'next/link'

export default function TeamCard({ journey }: { journey: any }) {
  const progress  = Math.min(Math.round((journey.current_week / 12) * 100), 100)
  const employee  = journey.employee

  return (
    <Link href={`/manager/team/${journey.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'opacity 0.15s',
      }}>
        <img
          src={employee.avatar_url || `https://i.pravatar.cc/32?u=${employee.id}`}
          alt={employee.full_name}
          style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--border)' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
            {employee.full_name}
          </strong>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            Week {journey.current_week} · {employee.department || 'General'}
          </span>
        </div>
        <div style={{ width: 72, height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{
            height: '100%', borderRadius: 100,
            width: `${progress}%`,
            background: journey.risk_score > 60 ? 'var(--red)' : 'var(--grad)',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <RiskBadge score={journey.risk_score} />
      </div>
    </Link>
  )
}
