'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import OrderSummary from '@/components/checkout/OrderSummary'
import CheckoutForm from '@/components/checkout/CheckoutForm'

const planFeatures: Record<string, string[]> = {
  starter: [
    'Up to 10 active new hires',
    '3 journey templates',
    'HR & Manager dashboards',
    'Email support',
  ],
  professional: [
    'Up to 50 active new hires',
    'Unlimited journey templates',
    'Custom journey builder',
    'Full analytics dashboard',
    'Automated reminders',
  ],
  enterprise: [
    'Unlimited new hires',
    'Advanced journey builder',
    'Corporate white-label',
    'Dedicated CSM',
    'Priority SLA',
  ],
}

const planNames: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
}

function CheckoutContent() {
  const searchParams = useSearchParams()

  const planId = searchParams.get('plan') || 'professional'
  const price = searchParams.get('price') || '149'
  const billing = searchParams.get('billing') || 'monthly'

  const planName = planNames[planId] || 'Professional'
  const features = planFeatures[planId] || planFeatures.professional

  return (
    <div className="checkout-shell">
      <OrderSummary
        planName={planName}
        price={price}
        billing={billing}
        features={features}
      />
      <CheckoutForm />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  )
}
