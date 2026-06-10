'use client'

import { useT } from '@/lib/i18n/context'

export default function HowItWorks() {
  const { t } = useT()
  return (
    <section className="section how" id="how-it-works">
      <div className="container">
        <div className="sec-head">
          <span className="sec-tag">{t('landing.howItWorks.tag')}</span>
          <h2>{t('landing.howItWorks.heading')}</h2>
          <p>{t('landing.howItWorks.sub')}</p>
        </div>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-num">01</div>
            <div className="how-icon cyan-icon"><i className="fa-solid fa-map-location-dot"></i></div>
            <h3>{t('landing.howItWorks.step1Title')}</h3>
            <p>{t('landing.howItWorks.step1Desc')}</p>
          </div>
          <div className="how-arrow"><i className="fa-solid fa-arrow-right"></i></div>
          <div className="how-card">
            <div className="how-num">02</div>
            <div className="how-icon blue-icon"><i className="fa-solid fa-person-chalkboard"></i></div>
            <h3>{t('landing.howItWorks.step2Title')}</h3>
            <p>{t('landing.howItWorks.step2Desc')}</p>
          </div>
          <div className="how-arrow"><i className="fa-solid fa-arrow-right"></i></div>
          <div className="how-card">
            <div className="how-num">03</div>
            <div className="how-icon aqua-icon"><i className="fa-solid fa-seedling"></i></div>
            <h3>{t('landing.howItWorks.step3Title')}</h3>
            <p>{t('landing.howItWorks.step3Desc')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
