import RiskBadge from './RiskBadge'
import Link from 'next/link'

export default function TeamCard({ journey }: { journey: any }) {
  const progress = Math.min(Math.round((journey.current_week / 12) * 100), 100)
  const employee = journey.employee

  return (
    <Link href={`/manager/team/${journey.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="hc-emp" style={{ cursor: 'pointer' }}>
        <img src={employee.avatar_url || `https://i.pravatar.cc/26?u=${employee.id}`} alt="" />
        <div className="hce-info">
          <strong>{employee.full_name}</strong>
          <span>Week {journey.current_week} · {employee.department || 'General'}</span>
        </div>
        <div className="hce-prog">
          <div className={`hce-bar${journey.risk_score > 60 ? ' risk' : ''}`} style={{ width: `${progress}%` }}></div>
        </div>
        <RiskBadge score={journey.risk_score} />
      </div>
    </Link>
  )
}
