export default function JourneyTimeline({ currentWeek, checkIns }: { currentWeek: number; checkIns: any[] }) {
  const progress = Math.min(Math.round((currentWeek / 12) * 100), 100)

  const milestones = [
    { label: 'D1', position: 0 },
    { label: 'M1', position: 33 },
    { label: 'M2', position: 66 },
    { label: 'M3', position: 100 },
  ]

  return (
    <div className="hc-timeline">
      <span className="htl-label">90-day journey progress</span>
      <div className="htl-track">
        <div className="htl-fill" style={{ width: `${progress}%` }}></div>
        {milestones.map((m) => (
          <div
            key={m.label}
            className={`htl-dot${m.position <= progress ? ' done' : ''}`}
            style={{ left: `${m.position}%` }}
          >
            <span>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
