'use client'

import { useState, useEffect } from 'react'

export default function Navbar() {
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
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="nav-actions">
          <a href="#pricing" className="btn btn-ghost">See plans</a>
          <a href="#pricing" className="btn btn-primary">Start free trial</a>
        </div>
        <button
          className="hamburger"
          id="hamburger"
          aria-label="Open menu"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>
      <div className={`mobile-nav${mobileOpen ? ' open' : ''}`} id="mobile-nav">
        <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it works</a>
        <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
        <a href="#pricing" onClick={() => setMobileOpen(false)}>Pricing</a>
        <a href="#faq" onClick={() => setMobileOpen(false)}>FAQ</a>
        <a href="#pricing" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} onClick={() => setMobileOpen(false)}>Start free trial</a>
      </div>
    </nav>
  )
}
