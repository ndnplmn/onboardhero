'use client'

interface WelcomeBannerProps {
  userName: string
  dayNumber: number
  avatarUrl?: string
}

export default function WelcomeBanner({ userName, dayNumber, avatarUrl }: WelcomeBannerProps) {
  return (
    <div className="wb">
      <div className="wb-info">
        <h2>Welcome to the team, {userName}! 👋</h2>
        <p>We&apos;re thrilled to have you here. You&apos;re currently on Day {dayNumber} of your onboarding journey.</p>
      </div>
      <img 
        src={avatarUrl || `https://i.pravatar.cc/100?u=${userName}`} 
        alt="User" 
        className="wb-ava" 
      />
    </div>
  )
}
