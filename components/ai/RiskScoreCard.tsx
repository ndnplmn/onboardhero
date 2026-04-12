'use client'

interface Props {
  employeeName: string
  department: string
  score: number
  currentWeek: number
  reasons: string[]
  avatarUrl?: string | null
  employeeId?: string
  onViewJourney?: () => void
}

export default function RiskScoreCard({
  employeeName,
  department,
  score,
  currentWeek,
  reasons,
  avatarUrl,
  employeeId,
  onViewJourney,
}: Props) {
  const level = score > 60 ? 'high' : score > 30 ? 'medium' : 'low'

  const LEVEL_CONFIG = {
    high:   { label: 'At Risk',       color: 'var(--red)',   bg: 'var(--red-bg)',    barColor: 'var(--red)',   accent: 'linear-gradient(90deg, var(--red), var(--amber))' },
    medium: { label: 'Needs Attention', color: 'var(--amber)', bg: 'var(--amber-bg)', barColor: 'var(--amber)', accent: 'linear-gradient(90deg, var(--amber), var(--red))' },
    low:    { label: 'On Track',      color: 'var(--green)', bg: 'var(--green-bg)', barColor: 'var(--green)', accent: 'var(--grad)' },
  }

  const lc = LEVEL_CONFIG[level]

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: lc.accent }} />

      <div style={{ padding: '16px 18px', paddingTop: 19 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <img
            src={avatarUrl || `https://i.pravatar.cc/40?u=${employeeId || employeeName}`}
            alt={employeeName}
            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {employeeName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              Week {currentWeek} &middot; {department}
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 800, padding: '3px 10px',
            borderRadius: 100, color: lc.color, background: lc.bg,
            flexShrink: 0,
          }}>
            <i className={`fa-solid ${level === 'high' ? 'fa-triangle-exclamation' : level === 'medium' ? 'fa-circle-exclamation' : 'fa-circle-check'}`} style={{ marginRight: 5, fontSize: 9 }} />
            {lc.label}
          </span>
        </div>

        {/* Score bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Risk Score
            </span>
            <span style={{
              fontSize: 14, fontWeight: 800,
              fontFamily: 'var(--font-display)', color: lc.color,
            }}>
              {score}
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 100,
              width: `${score}%`,
              background: lc.barColor,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Risk factors */}
        {reasons.length > 0 && (
          <div style={{ marginBottom: onViewJourney ? 12 : 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>
              Risk Factors
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {reasons.slice(0, 4).map((reason, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>
                  <i className="fa-solid fa-circle-dot" style={{ fontSize: 7, color: lc.color, marginTop: 4, flexShrink: 0 }} />
                  {reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View journey action */}
        {onViewJourney && (
          <button
            className="btn btn-outline btn-sm"
            onClick={onViewJourney}
            style={{ width: '100%', marginTop: 4, fontSize: 11, justifyContent: 'center' }}
          >
            <i className="fa-solid fa-route" /> View Journey
          </button>
        )}
      </div>
    </div>
  )
}
