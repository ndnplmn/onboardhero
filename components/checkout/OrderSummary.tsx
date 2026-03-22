'use client'

import Link from 'next/link'

interface OrderSummaryProps {
  planName: string
  price: string
  billing: string
  features: string[]
}

export default function OrderSummary({ planName, price, billing, features }: OrderSummaryProps) {
  return (
    <div className="checkout-left">
      <Link href="/" className="back-btn">
        <i className="fa-solid fa-arrow-left"></i> Back
      </Link>
      <img src="/ONBOARD_HERO_LOGO.png" alt="OnboardHero" className="co-logo" />
      <div className="co-summary">
        <p className="co-sum-label">Order summary</p>
        <div className="co-plan-row">
          <div className="co-plan-icon">
            <i className="fa-solid fa-rocket"></i>
          </div>
          <div className="co-plan-info">
            <strong>{planName} Plan</strong>
            <span>Billed {billing}</span>
          </div>
          <div className="co-plan-price">${price}/mo</div>
        </div>
        <div>
          {features.map((feat) => (
            <div className="co-feat-item" key={feat}>
              {feat}
            </div>
          ))}
        </div>
        <div className="co-total">
          <span>Total today</span>
          <strong>${price}/mo</strong>
        </div>
        <div className="co-trial-note">
          <i className="fa-solid fa-shield-halved"></i> 14-day free trial. Cancel anytime.
        </div>
      </div>
    </div>
  )
}
