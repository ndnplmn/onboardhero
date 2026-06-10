'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n/context'

export default function CTAStrip() {
  const { t } = useT()
  return (
    <section className="cta-strip">
      <div className="container">
        <div className="cta-inner">
          <div className="cta-bg-ring r1"></div>
          <div className="cta-bg-ring r2"></div>
          <img src="/ONBOARD_HERO_LOGO.png" alt="OnboardHero" className="cta-logo" />
          <h2>{t('landing.cta.heading')}</h2>
          <p>{t('landing.cta.sub')}</p>
          <Link href="/signup" className="btn btn-white btn-lg">
            {t('landing.cta.btn')} <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </section>
  )
}
