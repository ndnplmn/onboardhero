import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { dailyRiskScan } from '@/inngest/functions/daily-risk-scan'
import { sendNudge } from '@/inngest/functions/send-nudge'
import { milestoneCheck } from '@/inngest/functions/milestone-check'
import { weeklyDigest } from '@/inngest/functions/weekly-digest'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dailyRiskScan, sendNudge, milestoneCheck, weeklyDigest],
})
