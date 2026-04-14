import { getUser } from '@/lib/auth/get-user'
import { getFormsForEmployee } from '@/lib/db/queries/forms'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import HireFormsClient from './forms-client'

export const dynamic = 'force-dynamic'

// ── Mock fallback forms ────────────────────────────────────────────────────

const MOCK_FORMS = [
  {
    id: 'mf1',
    title: 'Personal Information & Emergency Contact',
    description: 'Required for payroll, benefits, and emergency procedures.',
    fields: [
      { id: 'f1', type: 'text',     label: 'Legal Full Name',          required: true  },
      { id: 'f2', type: 'text',     label: 'Home Address',             required: true  },
      { id: 'f3', type: 'text',     label: 'Emergency Contact Name',   required: true  },
      { id: 'f4', type: 'text',     label: 'Emergency Contact Phone',  required: true  },
      { id: 'f5', type: 'text',     label: 'Relationship',             required: false },
    ],
    submitted: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'mf2',
    title: 'Benefits Enrollment',
    description: 'Select your health insurance, dental, and 401k contribution preferences.',
    fields: [
      { id: 'f1', type: 'select',   label: 'Health Plan',              required: true  },
      { id: 'f2', type: 'select',   label: 'Dental Coverage',          required: true  },
      { id: 'f3', type: 'text',     label: '401k Contribution %',      required: false },
      { id: 'f4', type: 'text',     label: 'Beneficiary Name',         required: false },
    ],
    submitted: false,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'mf3',
    title: '30-Day Experience Survey',
    description: 'Share your first-month impressions to help us improve onboarding.',
    fields: [
      { id: 'f1', type: 'rating',   label: 'Overall onboarding experience', required: true },
      { id: 'f2', type: 'textarea', label: 'What went well?',               required: true },
      { id: 'f3', type: 'textarea', label: 'What could be improved?',       required: false },
      { id: 'f4', type: 'rating',   label: 'Manager support rating',        required: true },
    ],
    submitted: false,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'mf4',
    title: 'IT Equipment & Access Request',
    description: 'Confirm your hardware setup and request any additional software access.',
    fields: [
      { id: 'f1', type: 'text',     label: 'Laptop Model Received',         required: true  },
      { id: 'f2', type: 'textarea', label: 'Additional Software Needed',    required: false },
      { id: 'f3', type: 'text',     label: 'VPN Access Confirmed (Yes/No)', required: true  },
    ],
    submitted: true,
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
  },
]

export default async function HireFormsPage() {
  const user = await getUser()
  const { journey } = await getHireDashboardData(user.id)
  const dbForms = await getFormsForEmployee(user.id)

  const forms = dbForms.length > 0 ? dbForms : MOCK_FORMS

  return <HireFormsClient forms={forms} journeyId={journey?.id || null} />
}
