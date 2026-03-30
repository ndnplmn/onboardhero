import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import ResourcesClient from './resources-client'

export const dynamic = 'force-dynamic'

export default async function ResourcesPage() {
  const user = await getUser()
  const { resources } = await getHireDashboardData(user.id)

  return <ResourcesClient resources={resources} userId={user.id} />
}
