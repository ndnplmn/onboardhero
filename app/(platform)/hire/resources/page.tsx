import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import ResourcesClient from './resources-client'

export const dynamic = 'force-dynamic'

// ── Mock fallback resources ────────────────────────────────────────────────

const MOCK_RESOURCES = [
  { id: 'r1', title: 'Employee Handbook 2026',         description: 'Everything you need to know about working here — policies, benefits, and culture.', type: 'document', url: '#', icon: 'fa-file-lines', read_by: [] },
  { id: 'r2', title: 'IT Setup Guide',                 description: 'Step-by-step guide to configure your laptop, VPN, and development tools.',           type: 'document', url: '#', icon: 'fa-laptop',     read_by: [] },
  { id: 'r3', title: 'Company Culture Overview',       description: 'A 15-minute video walkthrough of our values, rituals, and remote-work norms.',       type: 'video',    url: '#', icon: 'fa-video',      read_by: [] },
  { id: 'r4', title: 'Benefits Enrollment Portal',     description: 'Health insurance, dental, vision, and 401k enrollment through the HR portal.',       type: 'link',     url: '#', icon: 'fa-link',       read_by: [] },
  { id: 'r5', title: 'Engineering Onboarding Checklist', description: 'Week-by-week technical milestones for new engineers joining the product team.',    type: 'document', url: '#', icon: 'fa-file-lines', read_by: [] },
  { id: 'r6', title: 'Meet the Team — People Directory', description: 'Org chart, Slack handles, and contact info for the full team.',                   type: 'contact',  url: '#', icon: 'fa-user',       read_by: [] },
  { id: 'r7', title: 'Security & Compliance Training',  description: 'Mandatory annual security training — must be completed in week 1.',                type: 'video',    url: '#', icon: 'fa-video',      read_by: [] },
  { id: 'r8', title: 'Product Roadmap (Confidential)', description: 'Current quarter roadmap with OKRs and feature priorities. Do not share externally.', type: 'document', url: '#', icon: 'fa-file-lines', read_by: [] },
]

export default async function ResourcesPage() {
  const user = await getUser()
  const { resources: dbResources } = await getHireDashboardData(user.id)

  const resources = dbResources.length > 0 ? dbResources : MOCK_RESOURCES

  return <ResourcesClient resources={resources} userId={user.id} />
}
