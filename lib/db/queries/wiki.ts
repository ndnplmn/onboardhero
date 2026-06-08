import { createSupabaseServer } from '@/lib/db/supabase-server'
import type { WikiArticle } from '@/components/platform/CompanyWiki'

const TYPE_TO_CATEGORY: Record<string, string> = {
  handbook:    'culture',
  guide:       'culture',
  policy:      'culture',
  benefits:    'benefits',
  it:          'it',
  security:    'it',
  engineering: 'engineering',
  product:     'product',
  office:      'office',
  link:        'culture',
  video:       'culture',
  document:    'culture',
}

function relativeDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Updated today'
  if (diff === 1) return 'Updated yesterday'
  if (diff < 7)  return `Updated ${diff} days ago`
  if (diff < 14) return 'Updated 1 week ago'
  return `Updated ${Math.floor(diff / 7)} weeks ago`
}

export async function getWikiArticles(): Promise<WikiArticle[]> {
  const supabase = await createSupabaseServer()

  const { data } = await supabase
    .from('resources')
    .select('id, title, description, type, url, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data || data.length === 0) return []

  return data.map((r: any) => ({
    id:       r.id,
    title:    r.title,
    excerpt:  r.description ?? '',
    category: TYPE_TO_CATEGORY[r.type?.toLowerCase()] ?? 'culture',
    date:     relativeDate(r.created_at),
    readTime: '3 min read',
    pinned:   false,
    url:      r.url ?? null,
  }))
}
