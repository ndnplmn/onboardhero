'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * useAura
 * Hook for context-aware proactive intelligence.
 */
export function useAura() {
  const pathname = usePathname()
  const [whisper, setWhisper] = useState<string | null>(null)

  useEffect(() => {
    // Proactive context-aware logic based on current page
    const getContextWhisper = () => {
      if (pathname.includes('/manager/dashboard')) {
        return "I've analyzed your team's integration velocity. Liam Evans might need a check-in on technical blockers."
      }
      if (pathname.includes('/hr/dashboard')) {
        return "3 hires are entering the 'Cultural Integration' phase. Want to see the recommended social events?"
      }
      if (pathname.includes('/recruit/dashboard')) {
        return "I see you're looking at your roadmap. Did you know 80% of successful hires finish the VPN setup by Day 2?"
      }
      if (pathname.includes('/resources')) {
        return "You're in the Resource Hub. The most viewed doc for your role today is 'Advanced DevOps Patterns'."
      }
      return null
    }

    const timer = setTimeout(() => {
      const w = getContextWhisper()
      if (w) setWhisper(w)
    }, 4000)

    return () => {
      clearTimeout(timer)
      setWhisper(null)
    }
  }, [pathname])

  return { whisper, setWhisper }
}
