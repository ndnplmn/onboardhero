import { getUser } from '@/lib/auth/get-user'
import { getFormsForEmployee } from '@/lib/db/queries/forms'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import HireFormsClient from './forms-client'

export const dynamic = 'force-dynamic'

export default async function HireFormsPage() {
  const user = await getUser()
  const { journey } = await getHireDashboardData(user.id)
  const forms = await getFormsForEmployee(user.id)

  return <HireFormsClient forms={forms} journeyId={journey?.id || null} />
}
