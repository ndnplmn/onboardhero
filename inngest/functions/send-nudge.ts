import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { sendNotificationEmail } from '@/lib/email/resend'

export const sendNudge = inngest.createFunction(
  { id: 'send-nudge', name: 'Send Nudge', triggers: [{ event: 'app/nudge.send' }] },
  async ({ event, step }) => {
    const { journeyId, managerId, employeeId, reason } = event.data as {
      journeyId: string
      managerId: string
      employeeId: string
      reason: string
    }

    const supabase = createSupabaseAdmin()

    const manager = await step.run('lookup-manager', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', managerId)
        .single()

      if (error) throw error
      return data
    })

    const employee = await step.run('lookup-employee', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', employeeId)
        .single()

      if (error) throw error
      return data
    })

    await step.run('create-notification', async () => {
      const { error } = await supabase.from('notifications').insert({
        user_id: managerId,
        type: 'nudge',
        title: `Nudge: ${employee.full_name}`,
        message: reason,
        action_url: `/journeys/${journeyId}`,
      })

      if (error) throw error
    })

    await step.run('send-email', async () => {
      await sendNotificationEmail(
        manager.email,
        `OnboardHero Nudge: ${employee.full_name}`,
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Action Needed for ${employee.full_name}</h2>
          <p>Hi ${manager.full_name},</p>
          <p>${reason}</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/journeys/${journeyId}"
               style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
              View Journey
            </a>
          </p>
          <p style="color: #6b7280; font-size: 14px;">— OnboardHero</p>
        </div>
        `
      )
    })

    return { success: true, managerId, employeeId }
  }
)
