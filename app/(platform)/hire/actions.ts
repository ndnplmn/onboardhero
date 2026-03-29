'use server'

import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { revalidatePath } from 'next/cache'

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  const supabase = createSupabaseAdmin()

  await supabase
    .from('journey_tasks')
    .update({
      status: completed ? 'completed' : 'pending',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)

  revalidatePath('/hire/dashboard')
  revalidatePath('/hire/tasks')
}
