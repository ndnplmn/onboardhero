'use client'

interface WelcomeBannerProps {
  userName: string
  dayNumber: number
  avatarUrl?: string
}

export default function WelcomeBanner({ userName, dayNumber, avatarUrl }: WelcomeBannerProps) {
  return (
    <div className="wb glass-panel-pro" style={{ padding: '30px 40px', gap: '24px', position: 'relative', overflow: 'visible' }}>
      <div className="wb-info" style={{ flex: 1 }}>
        <h2 style={{ fontSize: '24px', fontWeight: 850, marginBottom: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fa-solid fa-hand-wave" style={{ fontSize: 22 }} />
          Welcome to the team, {userName}!
        </h2>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>We&apos;re thrilled to have you here. You&apos;re currently on <span style={{ color: 'var(--cyan)', fontWeight: 800 }}>Day {dayNumber}</span> of your onboarding journey.</p>
      </div>
      <img 
        src={avatarUrl || `https://i.pravatar.cc/100?u=${userName}`} 
        alt="User" 
        className="wb-ava" 
        style={{ width: '64px', height: '64px', border: '3px solid #fff', boxShadow: '0 0 20px rgba(255,255,255,0.3)' }}
      />
      <div className="aura-dust" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 70% 30%, rgba(0,255,242,0.1), transparent 70%)' }} />
    </div>
  )
}
