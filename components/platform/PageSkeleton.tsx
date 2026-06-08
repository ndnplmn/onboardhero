export default function PageSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left" style={{ gap: 10, display: 'flex', flexDirection: 'column' }}>
          <div className="skeleton skeleton-title" style={{ width: 220 }} />
          <div className="skeleton skeleton-text" style={{ width: 340 }} />
        </div>
      </div>

      {/* Body */}
      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--gap-standard)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton skeleton-card" style={{ height: 100 }} />
          ))}
        </div>

        {/* Main content cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-standard)' }}>
          <div className="skeleton skeleton-card" style={{ height: 280 }} />
          <div className="skeleton skeleton-card" style={{ height: 280 }} />
        </div>

        <div className="skeleton skeleton-card" style={{ height: 200 }} />
      </div>
    </>
  )
}
