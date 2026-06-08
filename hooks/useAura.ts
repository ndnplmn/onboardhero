'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const INACTIVITY_KEY      = 'aura_last_active'
const INACTIVITY_SECS     = 48 * 60 * 60 * 1000  // 48 h
const HIRE_INACTIVITY_KEY = 'aura_hire_last_task'  // set by TaskList when a task is completed
const HIRE_INACTIVITY_MS  = 3 * 24 * 60 * 60 * 1000 // 3 days
const HISTORY_KEY         = 'aura_whisper_history'
const HISTORY_LIMIT       = 10

interface WhisperRecord {
  text: string
  at:   number
}

function refreshActivity() {
  try { localStorage.setItem(INACTIVITY_KEY, String(Date.now())) } catch { /* ignore */ }
}

export function recordTaskActivity() {
  try { localStorage.setItem(HIRE_INACTIVITY_KEY, String(Date.now())) } catch { /* ignore */ }
}

function appendHistory(text: string) {
  try {
    const prev: WhisperRecord[] = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    const next = [{ text, at: Date.now() }, ...prev].slice(0, HISTORY_LIMIT)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch { /* ignore */ }
}

export function getWhisperHistory(): WhisperRecord[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { return [] }
}

export function clearWhisperHistory() {
  try { localStorage.removeItem(HISTORY_KEY) } catch { /* ignore */ }
}

export function useAura() {
  const pathname = usePathname()
  const [whisper, setWhisper] = useState<string | null>(null)
  const fired = useRef(false)

  // Record activity on every page visit
  useEffect(() => { refreshActivity() }, [pathname])

  // Proactive page-load whisper (runs once per route change)
  useEffect(() => {
    fired.current = false
    setWhisper(null)

    const timer = setTimeout(() => {
      if (fired.current) return
      let w: string | null = null

      // Check 48 h inactivity first (highest priority)
      try {
        const last = Number(localStorage.getItem(INACTIVITY_KEY) ?? 0)
        if (last && Date.now() - last > INACTIVITY_SECS) {
          w = "Welcome back! It's been a couple of days. Want a quick recap of what needs your attention?"
        }
      } catch { /* ignore */ }

      if (!w) {
        if (pathname.includes('/manager/dashboard')) {
          w = "I've analyzed your team's progress. Any hires with at-risk status may need a check-in today."
        } else if (pathname.includes('/hr/dashboard')) {
          w = "Hires entering week 3–4 have the highest drop-off risk. Want to review who needs attention?"
        } else if (pathname.includes('/recruit/dashboard')) {
          w = "Did you know 80% of successful hires finish VPN setup by Day 2? I can help with blockers."
        } else if (pathname.includes('/resources')) {
          w = "You're in the Resource Hub. I can help you find the most relevant docs for your current stage."
        } else if (pathname.includes('/hire/dashboard')) {
          // Hire-specific: 3-day task inactivity
          try {
            const lastTask = Number(localStorage.getItem(HIRE_INACTIVITY_KEY) ?? 0)
            if (lastTask && Date.now() - lastTask > HIRE_INACTIVITY_MS) {
              w = "It's been a few days since your last task. Even one small win today keeps your momentum going — want me to find the easiest task to knock out?"
            }
          } catch { /* ignore */ }
        }
      }

      if (w) { fired.current = true; setWhisper(w) }
    }, 4000)

    return () => clearTimeout(timer)
  }, [pathname])

  // Real-time event triggers
  useEffect(() => {
    function onTaskCompleted(e: Event) {
      const { taskTitle } = (e as CustomEvent<{ taskTitle?: string }>).detail ?? {}
      fired.current = true
      recordTaskActivity()
      setWhisper(taskTitle
        ? `Nice work completing "${taskTitle}"! Want tips on what to tackle next, or is anything blocking you?`
        : "Task complete! You're building momentum. Want Aura to suggest your next priority?")
    }

    function onRiskSpike(e: Event) {
      const { hireName, riskScore } = (e as CustomEvent<{ hireName?: string; riskScore?: number }>).detail ?? {}
      fired.current = true
      setWhisper(hireName
        ? `${hireName}'s risk score just jumped to ${riskScore ?? '?'}/100. This is a good moment to send a quick check-in message.`
        : `A hire's risk score just spiked. Consider scheduling a check-in before it escalates.`)
    }

    function onMilestoneApproach(e: Event) {
      const { hireName, milestone } = (e as CustomEvent<{ hireName?: string; milestone?: string }>).detail ?? {}
      fired.current = true
      setWhisper(hireName
        ? `${hireName} is approaching their ${milestone ?? '30-day'} milestone. A proactive message now can make a big difference.`
        : `A hire is approaching a milestone check-in. Review their progress before it arrives.`)
    }

    function onPulseSubmitted(e: Event) {
      const { score } = (e as CustomEvent<{ score: number }>).detail ?? {}
      if (!score || score > 3) return
      fired.current = true
      const msgs: Record<number, string> = {
        1: "That sounds really tough. I'm here — want to talk through what's making this week hard?",
        2: "I'm sorry you're feeling this way. Sometimes small wins help. Want me to find one quick task you can knock out today?",
        3: "Rough week? I can suggest one thing that usually makes week 3-4 easier if you'd like.",
      }
      setWhisper(msgs[score] ?? "I noticed you're having a tough week. I'm here to help anytime.")
    }

    function onManagerViewed() {
      fired.current = true
      setWhisper("Your manager just reviewed your journey. This is a great time to reach out with any questions or updates!")
    }

    window.addEventListener('aura-task-completed',    onTaskCompleted)
    window.addEventListener('aura-pulse-submitted',   onPulseSubmitted)
    window.addEventListener('aura-manager-viewed',    onManagerViewed)
    window.addEventListener('aura-risk-spike',        onRiskSpike)
    window.addEventListener('aura-milestone-approach', onMilestoneApproach)
    return () => {
      window.removeEventListener('aura-task-completed',    onTaskCompleted)
      window.removeEventListener('aura-pulse-submitted',   onPulseSubmitted)
      window.removeEventListener('aura-manager-viewed',    onManagerViewed)
      window.removeEventListener('aura-risk-spike',        onRiskSpike)
      window.removeEventListener('aura-milestone-approach', onMilestoneApproach)
    }
  }, [])

  function setWhisperWithHistory(text: string | null) {
    setWhisper(text)
    if (text) appendHistory(text)
  }

  return { whisper, setWhisper: setWhisperWithHistory }
}
