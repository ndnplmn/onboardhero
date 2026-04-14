import { getAllForms, getFormSubmissions } from '@/lib/db/queries/forms'
import FormsClient from './forms-client'

export const dynamic = 'force-dynamic'

// ── Mock fallback ──────────────────────────────────────────────────────────

const MOCK_FORMS = [
  {
    id: 'mf1',
    title: 'Personal Information & Emergency Contact',
    description: 'Required personal details for payroll, benefits, and emergency procedures.',
    fields: [
      { id: 'f1', type: 'text',     label: 'Legal Full Name',         required: true  },
      { id: 'f2', type: 'text',     label: 'Home Address',            required: true  },
      { id: 'f3', type: 'text',     label: 'Emergency Contact Name',  required: true  },
      { id: 'f4', type: 'text',     label: 'Emergency Contact Phone', required: true  },
      { id: 'f5', type: 'text',     label: 'Relationship',            required: false },
    ],
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'mf2',
    title: 'Benefits Enrollment',
    description: 'Health insurance, dental coverage, and 401k contribution elections.',
    fields: [
      { id: 'f1', type: 'select',   label: 'Health Plan',             required: true  },
      { id: 'f2', type: 'select',   label: 'Dental Coverage',         required: true  },
      { id: 'f3', type: 'text',     label: '401k Contribution %',     required: false },
      { id: 'f4', type: 'text',     label: 'Beneficiary Name',        required: false },
    ],
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'mf3',
    title: 'IT Equipment & Access Request',
    description: 'Hardware confirmation and additional software/tool access requests.',
    fields: [
      { id: 'f1', type: 'text',     label: 'Laptop Model Received',        required: true  },
      { id: 'f2', type: 'textarea', label: 'Additional Software Needed',   required: false },
      { id: 'f3', type: 'text',     label: 'VPN Access Confirmed',         required: true  },
    ],
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'mf4',
    title: '30-Day Experience Survey',
    description: 'Collect first-month impressions from new hires to improve the onboarding process.',
    fields: [
      { id: 'f1', type: 'rating',   label: 'Overall onboarding experience', required: true  },
      { id: 'f2', type: 'textarea', label: 'What went well?',               required: true  },
      { id: 'f3', type: 'textarea', label: 'What could be improved?',       required: false },
      { id: 'f4', type: 'rating',   label: 'Manager support rating',        required: true  },
    ],
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'mf5',
    title: '90-Day Graduation Survey',
    description: 'Final onboarding survey before transitioning to standard performance management.',
    fields: [
      { id: 'f1', type: 'rating',   label: 'Overall 90-day experience',     required: true  },
      { id: 'f2', type: 'textarea', label: 'Biggest win in your first 90 days', required: true  },
      { id: 'f3', type: 'textarea', label: 'What support do you still need?',   required: false },
      { id: 'f4', type: 'rating',   label: 'Would you recommend this company?', required: true  },
    ],
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
]

const MOCK_SUBMISSIONS = [
  { id: 's1', form_id: 'mf1', submitted_at: new Date(Date.now() - 28 * 86400000).toISOString(), employee: { full_name: 'Marcus Reed',  email: 'marcus@company.com', department: 'Product'     } },
  { id: 's2', form_id: 'mf1', submitted_at: new Date(Date.now() - 20 * 86400000).toISOString(), employee: { full_name: 'Priya Mehta',  email: 'priya@company.com',  department: 'Engineering' } },
  { id: 's3', form_id: 'mf1', submitted_at: new Date(Date.now() - 60 * 86400000).toISOString(), employee: { full_name: 'James Wilson', email: 'james@company.com',  department: 'Sales'       } },
  { id: 's4', form_id: 'mf3', submitted_at: new Date(Date.now() - 27 * 86400000).toISOString(), employee: { full_name: 'Marcus Reed',  email: 'marcus@company.com', department: 'Product'     } },
  { id: 's5', form_id: 'mf3', submitted_at: new Date(Date.now() - 19 * 86400000).toISOString(), employee: { full_name: 'Priya Mehta',  email: 'priya@company.com',  department: 'Engineering' } },
  { id: 's6', form_id: 'mf4', submitted_at: new Date(Date.now() - 58 * 86400000).toISOString(), employee: { full_name: 'James Wilson', email: 'james@company.com',  department: 'Sales'       } },
  { id: 's7', form_id: 'mf5', submitted_at: new Date(Date.now() - 3  * 86400000).toISOString(), employee: { full_name: 'James Wilson', email: 'james@company.com',  department: 'Sales'       } },
]

export default async function HRFormsPage() {
  const [dbForms, dbSubmissions] = await Promise.all([
    getAllForms(),
    getFormSubmissions(),
  ])

  const forms       = dbForms.length       > 0 ? dbForms       : MOCK_FORMS
  const submissions = dbSubmissions.length > 0 ? dbSubmissions : MOCK_SUBMISSIONS

  return <FormsClient forms={forms} submissions={submissions} />
}
