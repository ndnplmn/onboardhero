import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string
) {
  await resend.emails.send({
    from: 'OnboardHero <onboarding@yourdomain.com>',
    to,
    subject,
    html,
  })
}
