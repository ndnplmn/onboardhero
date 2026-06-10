'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n/context'

export default function Hero() {
  const { t } = useT()
  return (
    <section className="hero" id="hero">
      <div className="hero-glow g1"></div>
      <div className="hero-glow g2"></div>
      <div className="hero-glow g3"></div>
      <div className="container hero-grid">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot"></span>
            {t('landing.hero.eyebrow')}
          </div>
          <h1 className="hero-h1">
            {t('landing.hero.h1a')}<br />
            <span className="gradient-text">{t('landing.hero.h1b')}</span><br />
            {t('landing.hero.h1c')}
          </h1>
          <p className="hero-sub">{t('landing.hero.sub')}</p>
          <div className="hero-btns">
            <Link href="/checkout?plan=professional" className="btn btn-primary btn-lg">
              {t('landing.hero.ctaPrimary')} <i className="fa-solid fa-arrow-right"></i>
            </Link>
            <a href="#how-it-works" className="btn btn-outline btn-lg">{t('landing.hero.ctaSecondary')}</a>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars">
              <img src="https://i.pravatar.cc/28?img=1" alt="" />
              <img src="https://i.pravatar.cc/28?img=2" alt="" />
              <img src="https://i.pravatar.cc/28?img=3" alt="" />
              <img src="https://i.pravatar.cc/28?img=4" alt="" />
            </div>
            <span><strong>2,400+</strong> {t('landing.hero.proof')}</span>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-card">
            <div className="hc-topbar">
              <div className="hc-dots"><span></span><span></span><span></span></div>
              <span className="hc-title">{t('landing.hero.dashTitle')}</span>
            </div>
            <div className="hc-body">
              <div className="hc-kpis">
                <div className="hc-kpi"><span className="hk-n cyan">24</span><span className="hk-l">{t('landing.hero.kpiJourneys')}</span></div>
                <div className="hc-kpi"><span className="hk-n blue">87%</span><span className="hk-l">{t('landing.hero.kpiOnTrack')}</span></div>
                <div className="hc-kpi"><span className="hk-n aqua">312</span><span className="hk-l">{t('landing.hero.kpiTasks')}</span></div>
              </div>
              <div className="hc-employees">
                <div className="hc-emp">
                  <img src="https://i.pravatar.cc/26?img=5" alt="" />
                  <div className="hce-info"><strong>Marcus Reed</strong><span>Week 1 · Strategy</span></div>
                  <div className="hce-prog"><div className="hce-bar" style={{ width: '22%' }}></div></div>
                  <span className="badge-on">{t('landing.hero.onTrack')}</span>
                </div>
                <div className="hc-emp">
                  <img src="https://i.pravatar.cc/26?img=6" alt="" />
                  <div className="hce-info"><strong>Sarah Kim</strong><span>Week 3 · Design</span></div>
                  <div className="hce-prog"><div className="hce-bar" style={{ width: '68%' }}></div></div>
                  <span className="badge-on">{t('landing.hero.onTrack')}</span>
                </div>
                <div className="hc-emp">
                  <img src="https://i.pravatar.cc/26?img=7" alt="" />
                  <div className="hce-info"><strong>Priya Mehta</strong><span>Day 45 · Sales</span></div>
                  <div className="hce-prog"><div className="hce-bar risk" style={{ width: '50%' }}></div></div>
                  <span className="badge-risk">{t('landing.hero.atRisk')}</span>
                </div>
              </div>
              <div className="hc-timeline">
                <span className="htl-label">{t('landing.hero.journeyProgress')}</span>
                <div className="htl-track"><div className="htl-fill" style={{ width: '40%' }}></div>
                  <div className="htl-dot" style={{ left: '0%' }}><span>D1</span></div>
                  <div className="htl-dot" style={{ left: '33%' }}><span>M1</span></div>
                  <div className="htl-dot" style={{ left: '66%' }}><span>M2</span></div>
                  <div className="htl-dot done" style={{ left: '100%' }}><span>M3</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
