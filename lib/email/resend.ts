import { Resend } from 'resend'

let resendInstance: Resend | null = null

function getResend() {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string
) {
  const resend = getResend()
  await resend.emails.send({
    from: 'OnboardHero <onboarding@yourdomain.com>',
    to,
    subject,
    html,
  })
}
