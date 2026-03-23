export default function RiskScoreCard({
  employeeName,
  department,
  score,
  currentWeek,
  reasons,
  avatarUrl,
  employeeId,
}: {
  employeeName: string
  department: string
  score: number
  currentWeek: number
  reasons: string[]
  avatarUrl?: string | null
  employeeId?: string
}) {
  const riskLevel = score > 70 ? 'high' : score > 40 ? 'medium' : 'low'
  const riskLabel = score > 70 ? 'At risk' : score > 40 ? 'Attention' : 'On track'
  const badgeClass = score > 70 ? 'badge-risk' : score > 40 ? 'badge-warn' : 'badge-on'

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background:
            riskLevel === 'high'
              ? 'linear-gradient(90deg, var(--red), var(--amber))'
              : riskLevel === 'medium'
                ? 'linear-gradient(90deg, var(--amber), #f87171)'
                : 'var(--grad)',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <img
          src={avatarUrl || `https://i.pravatar.cc/32?u=${employeeId || employeeName}`}
          alt=""
          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>{employeeName}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
            Week {currentWeek} &middot; {department}
          </span>
        </div>
        <span className={badgeClass}>{riskLabel}</span>
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 500 }}>Risk Score</span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              color:
                riskLevel === 'high'
                  ? 'var(--red)'
                  : riskLevel === 'medium'
                    ? 'var(--amber)'
                    : 'var(--green)',
            }}
          >
            {score}
          </span>
        </div>
        <div className="hce-prog" style={{ height: '6px' }}>
          <div
            className={`hce-bar${riskLevel !== 'low' ? ' risk' : ''}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Risk Factors
          </span>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--text2)', lineHeight: 1.6 }}>
            {reasons.slice(0, 4).map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
