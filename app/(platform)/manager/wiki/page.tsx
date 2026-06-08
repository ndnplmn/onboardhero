import CompanyWiki from '@/components/platform/CompanyWiki'
import { getWikiArticles } from '@/lib/db/queries/wiki'

export const dynamic = 'force-dynamic'

export default async function ManagerWikiPage() {
  const articles = await getWikiArticles()
  return <CompanyWiki articles={articles} />
}
