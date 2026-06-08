import { inngest } from '@/inngest/client'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { sendNotificationEmail } from '@/lib/email/resend'
import { nudgeEmailTemplate } from '@/lib/email/templates'
import { postToSlack, nudgeSlackMessage } from '@/lib/slack'

export const sendNudge = inngest.createFunction(
  { id: 'send-nudge', name: 'Send Nudge', triggers: [{ event: 'app/nudge.send' }] },
  async ({ event, step }) => {
    const { journeyId, managerId, employeeId, reason: rawReason } = event.data as {
      journeyId: string
      managerId: string
      employeeId: string
      reason: string
    }

    // Strip HTML/script tags to prevent injection in email body
    const reason = (rawReason ?? '').replace(/<[^>]*>/g, '').slice(0, 1000).trim()

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
        `Action needed: ${employee.full_name} needs your support`,
        nudgeEmailTemplate({
          managerName: manager.full_name,
          hireName: employee.full_name,
          message: reason,
          journeyId,
        })
      )
    })

    await step.run('slack-notification', async () => {
      await postToSlack(nudgeSlackMessage(employee.full_name, manager.full_name, reason, journeyId))
    })

    return { success: true, managerId, employeeId }
  }
)
