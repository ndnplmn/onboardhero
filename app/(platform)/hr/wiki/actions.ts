'use server'

import { createSupabaseServer } from '@/lib/db/supabase-server'
import { revalidatePath } from 'next/cache'

const CATEGORY_TO_TYPE: Record<string, string> = {
  culture:     'handbook',
  benefits:    'benefits',
  it:          'it',
  engineering: 'engineering',
  product:     'product',
  office:      'office',
}

export async function createWikiArticle(data: {
  title:    string
  category: string
  excerpt:  string
  readTime: string
  pinned:   boolean
  url?:     string
}) {
  const supabase = await createSupabaseServer()

  await supabase.from('resources').insert({
    title:       data.title,
    description: data.excerpt,
    type:        CATEGORY_TO_TYPE[data.category] ?? 'handbook',
    url:         data.url || null,
    icon:        null,
  })

  revalidatePath('/hr/wiki')
  revalidatePath('/hire/resources/wiki')
  revalidatePath('/manager/wiki')
}

export async function deleteWikiArticle(id: string) {
  const supabase = await createSupabaseServer()
  await supabase.from('resources').delete().eq('id', id)
  revalidatePath('/hr/wiki')
  revalidatePath('/hire/resources/wiki')
  revalidatePath('/manager/wiki')
}

export async function updateWikiArticle(id: string, data: {
  title?:   string
  excerpt?: string
  category?: string
  url?:     string
}) {
  const supabase = await createSupabaseServer()

  await supabase.from('resources').update({
    ...(data.title    ? { title: data.title }               : {}),
    ...(data.excerpt  ? { description: data.excerpt }       : {}),
    ...(data.category ? { type: CATEGORY_TO_TYPE[data.category] ?? 'handbook' } : {}),
    ...(data.url      ? { url: data.url }                   : {}),
  }).eq('id', id)

  revalidatePath('/hr/wiki')
  revalidatePath('/hire/resources/wiki')
  revalidatePath('/manager/wiki')
}
