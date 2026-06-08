import CompanyWiki from '@/components/platform/CompanyWiki'
import { getWikiArticles } from '@/lib/db/queries/wiki'
import { createWikiArticle, deleteWikiArticle } from './actions'

export const dynamic = 'force-dynamic'

export default async function HRWikiPage() {
  const articles = await getWikiArticles()
  return (
    <CompanyWiki
      canManage
      articles={articles}
      onCreateArticle={createWikiArticle}
      onDeleteArticle={deleteWikiArticle}
    />
  )
}
