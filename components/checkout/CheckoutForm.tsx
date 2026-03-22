'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'

function fmtCard(value: string): string {
  const digits = value.replace(/\D/g, '').substring(0, 16)
  return digits.replace(/(.{4})/g, '$1  ').trim()
}

function fmtExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').substring(0, 4)
  if (digits.length >= 2) {
    return digits.substring(0, 2) + ' / ' + digits.substring(2)
  }
  return digits
}

export default function CheckoutForm() {
  const [success, setSuccess] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(true)

  function handleCardNumber(e: ChangeEvent<HTMLInputElement>) {
    setCardNumber(fmtCard(e.target.value))
  }

  function handleExpiry(e: ChangeEvent<HTMLInputElement>) {
    setExpiry(fmtExpiry(e.target.value))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!firstName || !lastName || !email || !company) {
      alert('Please fill in all required fields.')
      return
    }
    if (!email.includes('@') || !email.includes('.')) {
      alert('Please enter a valid work email.')
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="checkout-right">
        <div className="success-wrap">
          <div className="success-icon">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <h2>Welcome to OnboardHero!</h2>
          <p>Your account has been created. Redirecting you to your dashboard...</p>
          <div className="success-bar-wrap">
            <div className="success-bar-fill"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-right">
      <form onSubmit={handleSubmit}>
        <h2>Complete your purchase</h2>
        <p className="co-sub">Start your 14-day free trial — no charge for 14 days.</p>

        <div className="form-section">Personal information</div>
        <div className="form-row two">
          <div className="fg">
            <label>First name</label>
            <input
              type="text"
              placeholder="Marcus"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="fg">
            <label>Last name</label>
            <input
              type="text"
              placeholder="Reed"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div className="fg">
          <label>Work email</label>
          <input
            type="email"
            placeholder="marcus@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="fg">
          <label>Company name</label>
          <input
            type="text"
            placeholder="Acme Corp"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div className="fg">
          <label>Company size</label>
          <select value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
            <option value="">Select size</option>
            <option>1–10</option>
            <option>11–50</option>
            <option>51–200</option>
            <option>201–500</option>
            <option>500+</option>
          </select>
        </div>

        <div className="form-section" style={{ marginTop: 24 }}>Payment details</div>
        <div className="fg card-fg">
          <label>Card number</label>
          <div className="card-wrap">
            <input
              type="text"
              placeholder="1234  5678  9012  3456"
              maxLength={19}
              value={cardNumber}
              onChange={handleCardNumber}
            />
            <div className="card-brands">
              <i className="fa-brands fa-cc-visa"></i>
              <i className="fa-brands fa-cc-mastercard"></i>
            </div>
          </div>
        </div>
        <div className="form-row two">
          <div className="fg">
            <label>Expiry</label>
            <input
              type="text"
              placeholder="MM / YY"
              maxLength={7}
              value={expiry}
              onChange={handleExpiry}
            />
          </div>
          <div className="fg">
            <label>CVV</label>
            <input
              type="text"
              placeholder="CVV"
              maxLength={3}
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>
        <div className="fg">
          <label>Name on card</label>
          <input
            type="text"
            placeholder="Marcus Reed"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
          />
        </div>

        <label className="chk-row">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
        </label>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: 20 }}
        >
          <i className="fa-solid fa-lock"></i> Complete purchase — Start free trial
        </button>
        <p className="secure-note">
          <i className="fa-solid fa-shield-halved"></i> Secured by 256-bit SSL encryption.
        </p>
      </form>
    </div>
  )
}
