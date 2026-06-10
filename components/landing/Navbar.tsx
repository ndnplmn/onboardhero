'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'
import LanguageToggle from '@/components/platform/LanguageToggle'

export default function Navbar() {
  const { t } = useT()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
      <div className="nav-inner">
        <a className="logo-link" href="#" onClick={(e) => e.preventDefault()}>
          <img src="/ONBOARD_HERO_LOGO.png" alt="OnboardHero" className="logo-img" />
        </a>
        <ul className="nav-links">
          <li><a href="#how-it-works">{t('landing.navbar.howItWorks')}</a></li>
          <li><a href="#features">{t('landing.navbar.features')}</a></li>
          <li><a href="#pricing">{t('landing.navbar.pricing')}</a></li>
          <li><a href="#faq">{t('landing.navbar.faq')}</a></li>
        </ul>
        <div className="nav-actions">
          <LanguageToggle />
          <a href="#pricing" className="btn btn-ghost">{t('landing.navbar.seePlans')}</a>
          <Link href="/login" className="btn btn-ghost">{t('landing.navbar.login')}</Link>
          <a href="#pricing" className="btn btn-primary">{t('landing.navbar.startTrial')}</a>
        </div>
        <button
          className="hamburger"
          id="hamburger"
          aria-label={t('landing.navbar.openMenu')}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>
      <div className={`mobile-nav${mobileOpen ? ' open' : ''}`} id="mobile-nav">
        <a href="#how-it-works" onClick={() => setMobileOpen(false)}>{t('landing.navbar.howItWorks')}</a>
        <a href="#features" onClick={() => setMobileOpen(false)}>{t('landing.navbar.features')}</a>
        <a href="#pricing" onClick={() => setMobileOpen(false)}>{t('landing.navbar.pricing')}</a>
        <a href="#faq" onClick={() => setMobileOpen(false)}>{t('landing.navbar.faq')}</a>
        <Link href="/login" onClick={() => setMobileOpen(false)}>{t('landing.navbar.login')}</Link>
        <a href="#pricing" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} onClick={() => setMobileOpen(false)}>{t('landing.navbar.startTrial')}</a>
      </div>
    </nav>
  )
}
