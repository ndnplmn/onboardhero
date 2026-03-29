import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import ContentClient from './content-client'

export const dynamic = 'force-dynamic'

export default async function HRContent() {
  const supabase = createSupabaseAdmin()

  const { data: resources } = await supabase
    .from('resources')
    .select('id, title, type, department, ai_generated, created_at')
    .order('created_at', { ascending: false })

  return <ContentClient resources={resources || []} />
}
