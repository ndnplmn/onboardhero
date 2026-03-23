'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const CheckInAgenda = dynamic(() => import('@/components/ai/CheckInAgenda'), { ssr: false })

interface TeamMemberCoachButtonProps {
  employeeName: string
  journeyId: string
}

export default function TeamMemberCoachButton({ employeeName, journeyId }: TeamMemberCoachButtonProps) {
  const [showCoach, setShowCoach] = useState(false)

  return (
    <>
      <button className="btn btn-primary" onClick={() => setShowCoach(true)}>
        <i className="fa-solid fa-user-tie" style={{ marginRight: '6px' }}></i>
        AI Coach
      </button>

      {showCoach && (
        <CheckInAgenda
          onClose={() => setShowCoach(false)}
          employeeName={employeeName}
          journeyId={journeyId}
        />
      )}
    </>
  )
}
