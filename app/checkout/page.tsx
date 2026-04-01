'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get('plan') || 'professional'
  const billing = searchParams.get('billing') || 'monthly'

  const [formStep, setFormStep] = useState(1)
  const [isSuccess, setIsSuccess] = useState(false)

  const plans = {
    starter: { name: 'Starter', monthly: 49, annual: 39 },
    professional: { name: 'Professional', monthly: 149, annual: 119 },
    enterprise: { name: 'Enterprise', monthly: 399, annual: 319 }
  }

  const selectedPlan = plans[plan as keyof typeof plans] || plans.professional
  const price = billing === 'annual' ? selectedPlan.annual : selectedPlan.monthly

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (formStep < 3) {
      setFormStep(formStep + 1)
    } else {
      setIsSuccess(true)
    }
  }

  if (isSuccess) {
    return (
      <div className="checkout-success" style={{ textAlign: 'center', padding: '120px 20px', background: 'var(--bg)', minHeight: '100vh' }}>
        <div className="success-icon" style={{ fontSize: '64px', color: 'var(--cyan)', marginBottom: '24px' }}>
          <i className="fa-solid fa-circle-check"></i>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px', fontWeight: 800 }}>Welcome to the Hero Team!</h1>
        <p style={{ color: 'var(--text2)', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px', fontSize: '16px' }}>
          Your workspace is being prepared. You'll receive an email with your login details and a getting started guide in a few minutes.
        </p>
        <Link href="/login" className="btn btn-primary btn-lg">Go to Login</Link>
      </div>
    )
  }

  return (
    <div className="checkout-shell">
      {/* LEFT: ORDER SUMMARY (Mockup style has summary on left) */}
      <div className="checkout-left">
        <button onClick={() => router.back()} className="back-btn">
          <i className="fa-solid fa-arrow-left"></i> Back to pricing
        </button>
        
        <img src="/ONBOARD_HERO_LOGO.png" alt="OnboardHero" className="co-logo" />
        
        <div className="co-sum-label">Order Summary</div>
        
        <div className="co-plan-row">
          <div className="co-plan-icon">
            <i className={`fa-solid ${plan === 'starter' ? 'fa-seedling' : plan === 'professional' ? 'fa-rocket' : 'fa-building'}`}></i>
          </div>
          <div className="co-plan-info">
            <strong>{selectedPlan.name} Plan</strong>
            <span>Billed {billing}</span>
          </div>
          <div className="co-plan-price">${price}</div>
        </div>

        <div id="co-features">
          <div className="co-feat-item">Access to all {selectedPlan.name} features</div>
          <div className="co-feat-item">Unlimited HR & Manager seats</div>
          <div className="co-feat-item">Secure data encryption</div>
          <div className="co-feat-item">24/7 Priority support</div>
        </div>

        <div className="co-total">
          <span>Total due today</span>
          <strong>${price}.00</strong>
        </div>

        <div className="co-trial-note">
          <i className="fa-solid fa-calendar-check"></i>
          <span>Includes 14-day free trial. Cancel anytime.</span>
        </div>
      </div>

      {/* RIGHT: FORM */}
      <div className="checkout-right">
        <div style={{ maxWidth: '480px' }}>
          <h2>Complete your purchase</h2>
          <p className="co-sub">Join 500+ companies streamlining their employee onboarding.</p>

          <form onSubmit={handleNext}>
            {formStep === 1 && (
              <div className="animated-step">
                <div className="form-section">1. Account Details</div>
                <div className="form-row two">
                  <div className="fg">
                    <label>First Name</label>
                    <input type="text" placeholder="John" required />
                  </div>
                  <div className="fg">
                    <label>Last Name</label>
                    <input type="text" placeholder="Doe" required />
                  </div>
                </div>
                <div className="fg">
                  <label>Work Email</label>
                  <input type="email" placeholder="john@company.com" required />
                </div>
                <div className="fg">
                  <label>Password</label>
                  <input type="password" placeholder="••••••••" required />
                </div>
              </div>
            )}

            {formStep === 2 && (
              <div className="animated-step">
                <div className="form-section">2. Company Info</div>
                <div className="fg">
                  <label>Company Name</label>
                  <input type="text" placeholder="Acme Inc." required />
                </div>
                <div className="fg">
                  <label>Company Size</label>
                  <select required>
                    <option value="">Select size...</option>
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>51-200 employees</option>
                    <option>201-500 employees</option>
                    <option>500+ employees</option>
                  </select>
                </div>
              </div>
            )}

            {formStep === 3 && (
              <div className="animated-step">
                <div className="form-section">3. Payment Method</div>
                <div className="fg">
                  <label>Card Number</label>
                  <input type="text" placeholder="**** **** **** 4242" required />
                </div>
                <div className="form-row two">
                  <div className="fg">
                    <label>Expiry Date</label>
                    <input type="text" placeholder="MM/YY" required />
                  </div>
                  <div className="fg">
                    <label>CVC</label>
                    <input type="text" placeholder="123" required />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '32px' }}>
              <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                {formStep === 3 ? 'Start My Free Trial' : 'Continue to next step'}
              </button>
            </div>
          </form>

          <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text3)', textAlign: 'center' }}>
            By continuing, you agree to OnboardHero&apos;s <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="co-loading">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
