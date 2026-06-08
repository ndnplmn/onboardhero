const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

interface SlackPayload {
  text: string
  blocks?: object[]
}

export async function postToSlack(payload: SlackPayload): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Non-blocking — Slack failures must not affect core flows
  }
}

export function nudgeSlackMessage(hireName: string, managerName: string, reason: string, journeyId: string): SlackPayload {
  return {
    text: `Onboarding nudge sent for ${hireName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:bell: *Onboarding Nudge Sent*\n*Hire:* ${hireName}\n*Manager:* ${managerName}\n*Reason:* ${reason}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Journey' },
            url: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/manager/team/${journeyId}`,
          },
        ],
      },
    ],
  }
}

export function riskAlertSlackMessage(hireName: string, managerName: string, riskScore: number, summary: string): SlackPayload {
  const emoji = riskScore >= 80 ? ':rotating_light:' : ':warning:'
  return {
    text: `${emoji} Risk alert: ${hireName} (score ${riskScore}/100)`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *Risk Alert*\n*Hire:* ${hireName}\n*Manager:* ${managerName}\n*Risk Score:* ${riskScore}/100\n*Summary:* ${summary}`,
        },
      },
    ],
  }
}
