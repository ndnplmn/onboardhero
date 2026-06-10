'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'

export default function Pricing() {
  const { t } = useT()
  const [annual, setAnnual] = useState(false)

  const starterPrice      = annual ? 39 : 49
  const professionalPrice = annual ? 119 : 149
  const enterprisePrice   = annual ? 319 : 399

  const billing = annual ? 'annual' : 'monthly'

  const starter = [
    { yes: true,  key: 'starterF0' }, { yes: true,  key: 'starterF1' },
    { yes: true,  key: 'starterF2' }, { yes: true,  key: 'starterF3' },
    { yes: true,  key: 'starterF4' }, { yes: false, key: 'starterM0' },
    { yes: false, key: 'starterM1' }, { yes: false, key: 'starterM2' },
  ] as const
  const pro = [
    { yes: true,  key: 'proF0' }, { yes: true,  key: 'proF1' },
    { yes: true,  key: 'proF2' }, { yes: true,  key: 'proF3' },
    { yes: true,  key: 'proF4' }, { yes: true,  key: 'proF5' },
    { yes: true,  key: 'proF6' }, { yes: false, key: 'proM0' },
  ] as const
  const ent = [
    { yes: true, key: 'entF0' }, { yes: true, key: 'entF1' },
    { yes: true, key: 'entF2' }, { yes: true, key: 'entF3' },
    { yes: true, key: 'entF4' }, { yes: true, key: 'entF5' },
    { yes: true, key: 'entF6' }, { yes: true, key: 'entF7' },
  ] as const

  return (
    <section className="section pricing-sec" id="pricing">
      <div className="container">
        <div className="sec-head">
          <span className="sec-tag">{t('landing.pricing.tag')}</span>
          <h2>{t('landing.pricing.heading')}</h2>
          <p>{t('landing.pricing.sub')}</p>
        </div>
        <div className="billing-toggle">
          <span id="toggle-monthly" className={`tl${!annual ? ' active' : ''}`}>{t('landing.pricing.monthly')}</span>
          <label className="switch">
            <input type="checkbox" id="billing-cb" checked={annual} onChange={() => setAnnual(!annual)} />
            <span className="slider"></span>
          </label>
          <span id="toggle-annual" className={`tl${annual ? ' active' : ''}`}>
            {t('landing.pricing.annual')} <em className="save-pill">{t('landing.pricing.save')}</em>
          </span>
        </div>
        <div className="price-grid">
          {/* STARTER */}
          <div className="price-card" data-plan="starter">
            <div className="pc-name">{t('landing.pricing.starterName')}</div>
            <div className="pc-price-wrap">
              <span className="pc-curr">$</span>
              <span className="pc-amount">{starterPrice}</span>
              <span className="pc-per">{t('landing.pricing.perMonth')}</span>
            </div>
            <p className="pc-desc">{t('landing.pricing.starterDesc')}</p>
            <ul className="pc-list">
              {starter.map(({ yes, key }) => (
                <li key={key} className={yes ? 'y' : 'n'}>
                  <i className={`fa-solid ${yes ? 'fa-check' : 'fa-xmark'}`}></i>
                  {t(`landing.pricing.${key}` as never)}
                </li>
              ))}
            </ul>
            <Link href={`/checkout?plan=starter&billing=${billing}`} className="btn btn-outline btn-block">{t('landing.pricing.chooseStarter')}</Link>
          </div>
          {/* PROFESSIONAL */}
          <div className="price-card featured" data-plan="professional">
            <div className="pc-pop">{t('landing.pricing.mostPopular')}</div>
            <div className="pc-name">{t('landing.pricing.proName')}</div>
            <div className="pc-price-wrap">
              <span className="pc-curr">$</span>
              <span className="pc-amount">{professionalPrice}</span>
              <span className="pc-per">{t('landing.pricing.perMonth')}</span>
            </div>
            <p className="pc-desc">{t('landing.pricing.proDesc')}</p>
            <ul className="pc-list">
              {pro.map(({ yes, key }) => (
                <li key={key} className={yes ? 'y' : 'n'}>
                  <i className={`fa-solid ${yes ? 'fa-check' : 'fa-xmark'}`}></i>
                  {t(`landing.pricing.${key}` as never)}
                </li>
              ))}
            </ul>
            <Link href={`/checkout?plan=professional&billing=${billing}`} className="btn btn-primary btn-block">{t('landing.pricing.choosePro')}</Link>
          </div>
          {/* ENTERPRISE */}
          <div className="price-card" data-plan="enterprise">
            <div className="pc-name">{t('landing.pricing.entName')}</div>
            <div className="pc-price-wrap">
              <span className="pc-curr">$</span>
              <span className="pc-amount">{enterprisePrice}</span>
              <span className="pc-per">{t('landing.pricing.perMonth')}</span>
            </div>
            <p className="pc-desc">{t('landing.pricing.entDesc')}</p>
            <ul className="pc-list">
              {ent.map(({ yes, key }) => (
                <li key={key} className={yes ? 'y' : 'n'}>
                  <i className={`fa-solid ${yes ? 'fa-check' : 'fa-xmark'}`}></i>
                  {t(`landing.pricing.${key}` as never)}
                </li>
              ))}
            </ul>
            <Link href={`/checkout?plan=enterprise&billing=${billing}`} className="btn btn-outline btn-block">{t('landing.pricing.chooseEnt')}</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
