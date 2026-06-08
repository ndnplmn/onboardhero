import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { dailyRiskScan } from '@/inngest/functions/daily-risk-scan'
import { sendNudge } from '@/inngest/functions/send-nudge'
import { milestoneCheck } from '@/inngest/functions/milestone-check'
import { weeklyDigest } from '@/inngest/functions/weekly-digest'
import { onTaskOverdue, onHireInactive, onCheckInMissed } from '@/inngest/functions/realtime-risk-triggers'
import { onMoraleLow } from '@/inngest/functions/morale-alert'
import { proactiveAuraPush } from '@/inngest/functions/proactive-aura-push'
import { preboardingEscalation } from '@/inngest/functions/preboarding-escalation'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dailyRiskScan, sendNudge, milestoneCheck, weeklyDigest, onTaskOverdue, onHireInactive, onCheckInMissed, onMoraleLow, proactiveAuraPush, preboardingEscalation],
})
