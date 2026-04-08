import { getHRDashboardData } from '@/lib/db/queries/dashboard'
import HRDashboardClient from './HRDashboardClient'

export const dynamic = 'force-dynamic'

export default async function HRDashboard() {
  const { journeys, tasks } = await getHRDashboardData()

  const engagementData = [
    { label: 'Mon', value: 85 },
    { label: 'Tue', value: 92 },
    { label: 'Wed', value: 89 },
    { label: 'Thu', value: 94 },
    { label: 'Fri', value: 91 },
  ]

  const completionData = [
    { label: 'Product', value: 95 },
    { label: 'Sales', value: 82 },
    { label: 'Eng', value: 88 },
    { label: 'HR', value: 100 },
  ]

  const mockStages = [
    { label: 'Pre-boarding', count: 12 },
    { label: 'First Week', count: journeys.filter((j: any) => j.status !== 'completed').length },
    { label: 'First Month', count: 5 },
    { label: 'Ramp-up', count: 2 },
  ]

  return (
    <HRDashboardClient
      initialData={{ journeys, tasks }}
      engagementData={engagementData}
      completionData={completionData}
      mockStages={mockStages}
    />
  )
}
