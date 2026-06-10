'use client'

import { useT } from '@/lib/i18n/context'

export default function Footer() {
  const { t } = useT()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/ONBOARD_HERO_LOGO.png" alt="OnboardHero" className="footer-logo" />
            <p>{t('landing.footer.tagline')}</p>
            <div className="footer-social">
              <a href="#"><i className="fa-brands fa-linkedin"></i></a>
              <a href="#"><i className="fa-brands fa-twitter"></i></a>
              <a href="#"><i className="fa-brands fa-github"></i></a>
            </div>
          </div>
          <div className="footer-col">
            <h5>{t('landing.footer.productCol')}</h5>
            <a href="#">{t('landing.footer.features')}</a>
            <a href="#">{t('landing.footer.pricing')}</a>
            <a href="#">{t('landing.footer.integrations')}</a>
            <a href="#">{t('landing.footer.changelog')}</a>
          </div>
          <div className="footer-col">
            <h5>{t('landing.footer.companyCol')}</h5>
            <a href="#">{t('landing.footer.about')}</a>
            <a href="#">{t('landing.footer.careers')}</a>
            <a href="#">{t('landing.footer.blog')}</a>
            <a href="#">{t('landing.footer.contact')}</a>
          </div>
          <div className="footer-col">
            <h5>{t('landing.footer.resourcesCol')}</h5>
            <a href="#">{t('landing.footer.docs')}</a>
            <a href="#">{t('landing.footer.help')}</a>
            <a href="#">{t('landing.footer.templates')}</a>
            <a href="#">{t('landing.footer.webinars')}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t('landing.footer.copyright')}</span>
          <div className="footer-legal">
            <a href="#">{t('landing.footer.privacy')}</a>
            <a href="#">{t('landing.footer.terms')}</a>
            <a href="#">{t('landing.footer.cookies')}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
