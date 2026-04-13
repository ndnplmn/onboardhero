'use client'

interface WelcomeBannerProps {
  userName: string
  dayNumber: number
  avatarUrl?: string
}

export default function WelcomeBanner({ userName, dayNumber, avatarUrl }: WelcomeBannerProps) {
  return (
    <div className="wb glass-panel-pro" style={{ padding: '30px 40px', gap: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Decorative aura */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle at 70% 30%, rgba(0,255,242,0.12), transparent 70%)',
        }}
      />

      <div className="wb-info" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 24, fontWeight: 850, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fa-solid fa-hand-wave" style={{ fontSize: 22 }} aria-hidden="true" />
          Welcome to the team, {userName}!
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.5 }}>
          You&apos;re on{' '}
          <strong style={{ color: '#fff', fontWeight: 800 }}>Day {dayNumber}</strong>{' '}
          of your 90-day onboarding journey. Keep going — you&apos;re doing great!
        </p>
      </div>

      <img
        src={avatarUrl || `https://i.pravatar.cc/100?u=${userName}`}
        alt={`${userName}'s avatar`}
        className="wb-ava"
        style={{
          width: 64, height: 64,
          border: '3px solid rgba(255,255,255,0.35)',
          boxShadow: '0 0 24px rgba(255,255,255,0.2)',
          position: 'relative', zIndex: 1,
        }}
      />
    </div>
  )
}
