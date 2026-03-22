'use client'

import { useState } from 'react'

export default function Pricing() {
  const [annual, setAnnual] = useState(false)

  const starterPrice = annual ? 39 : 49
  const professionalPrice = annual ? 119 : 149
  const enterprisePrice = annual ? 319 : 399

  return (
    <section className="section pricing-sec" id="pricing">
      <div className="container">
        <div className="sec-head">
          <span className="sec-tag">Pricing</span>
          <h2>Simple, transparent pricing</h2>
          <p>Start small or scale company-wide. Every plan includes a 14-day free trial — no card needed.</p>
        </div>
        <div className="billing-toggle">
          <span id="toggle-monthly" className={`tl${!annual ? ' active' : ''}`}>Monthly</span>
          <label className="switch">
            <input
              type="checkbox"
              id="billing-cb"
              checked={annual}
              onChange={() => setAnnual(!annual)}
            />
            <span className="slider"></span>
          </label>
          <span id="toggle-annual" className={`tl${annual ? ' active' : ''}`}>Annual <em className="save-pill">Save 20%</em></span>
        </div>
        <div className="price-grid">
          {/* STARTER */}
          <div className="price-card" data-plan="starter" data-monthly="49" data-annual="39">
            <div className="pc-name">Starter</div>
            <div className="pc-price-wrap">
              <span className="pc-curr">$</span>
              <span className="pc-amount" id="p-starter">{starterPrice}</span>
              <span className="pc-per">/mo</span>
            </div>
            <p className="pc-desc">For small teams taking their first steps toward structured onboarding.</p>
            <ul className="pc-list">
              <li className="y"><i className="fa-solid fa-check"></i> Up to 10 active new hires</li>
              <li className="y"><i className="fa-solid fa-check"></i> 3 journey templates</li>
              <li className="y"><i className="fa-solid fa-check"></i> Basic task assignment</li>
              <li className="y"><i className="fa-solid fa-check"></i> HR &amp; Manager dashboards</li>
              <li className="y"><i className="fa-solid fa-check"></i> Email support</li>
              <li className="n"><i className="fa-solid fa-xmark"></i> Custom journeys</li>
              <li className="n"><i className="fa-solid fa-xmark"></i> Analytics dashboard</li>
              <li className="n"><i className="fa-solid fa-xmark"></i> Integrations</li>
            </ul>
            <button className="btn btn-outline btn-block">Choose Starter</button>
          </div>
          {/* PROFESSIONAL */}
          <div className="price-card featured" data-plan="professional" data-monthly="149" data-annual="119">
            <div className="pc-pop">Most popular</div>
            <div className="pc-name">Professional</div>
            <div className="pc-price-wrap">
              <span className="pc-curr">$</span>
              <span className="pc-amount" id="p-professional">{professionalPrice}</span>
              <span className="pc-per">/mo</span>
            </div>
            <p className="pc-desc">For growing companies building a repeatable, high-quality onboarding experience.</p>
            <ul className="pc-list">
              <li className="y"><i className="fa-solid fa-check"></i> Up to 50 active new hires</li>
              <li className="y"><i className="fa-solid fa-check"></i> Unlimited journey templates</li>
              <li className="y"><i className="fa-solid fa-check"></i> Custom journey builder</li>
              <li className="y"><i className="fa-solid fa-check"></i> Full role-based dashboards</li>
              <li className="y"><i className="fa-solid fa-check"></i> Automated reminders</li>
              <li className="y"><i className="fa-solid fa-check"></i> Onboarding analytics</li>
              <li className="y"><i className="fa-solid fa-check"></i> Manager collaboration tools</li>
              <li className="n"><i className="fa-solid fa-xmark"></i> White-label / branding</li>
            </ul>
            <button className="btn btn-primary btn-block">Choose Professional</button>
          </div>
          {/* ENTERPRISE */}
          <div className="price-card" data-plan="enterprise" data-monthly="399" data-annual="319">
            <div className="pc-name">Enterprise</div>
            <div className="pc-price-wrap">
              <span className="pc-curr">$</span>
              <span className="pc-amount" id="p-enterprise">{enterprisePrice}</span>
              <span className="pc-per">/mo</span>
            </div>
            <p className="pc-desc">For large organizations requiring advanced customization, analytics, and dedicated support.</p>
            <ul className="pc-list">
              <li className="y"><i className="fa-solid fa-check"></i> Unlimited new hires</li>
              <li className="y"><i className="fa-solid fa-check"></i> Advanced journey builder</li>
              <li className="y"><i className="fa-solid fa-check"></i> Multi-department management</li>
              <li className="y"><i className="fa-solid fa-check"></i> Advanced analytics &amp; reporting</li>
              <li className="y"><i className="fa-solid fa-check"></i> Corporate white-label</li>
              <li className="y"><i className="fa-solid fa-check"></i> Unlimited HRIS integrations</li>
              <li className="y"><i className="fa-solid fa-check"></i> SSO / SAML support</li>
              <li className="y"><i className="fa-solid fa-check"></i> Dedicated CSM &amp; priority SLA</li>
            </ul>
            <button className="btn btn-outline btn-block">Choose Enterprise</button>
          </div>
        </div>
      </div>
    </section>
  )
}
