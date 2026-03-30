import { getAllForms, getFormSubmissions } from '@/lib/db/queries/forms'
import FormsClient from './forms-client'

export const dynamic = 'force-dynamic'

export default async function HRFormsPage() {
  const [forms, submissions] = await Promise.all([
    getAllForms(),
    getFormSubmissions(),
  ])

  return <FormsClient forms={forms} submissions={submissions} />
}
