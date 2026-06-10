'use client'

import { useT } from '@/lib/i18n/context'

const ICONS = ['fa-route', 'fa-list-check', 'fa-gauge-high', 'fa-bell', 'fa-chart-bar', 'fa-handshake', 'fa-flag-checkered', 'fa-plug']

export default function Features() {
  const { t } = useT()
  const items = ICONS.map((icon, i) => ({
    icon,
    title: t(`landing.features.item${i}.title` as never),
    desc: t(`landing.features.item${i}.desc` as never),
  }))

  return (
    <section className="section features-sec" id="features">
      <div className="container">
        <div className="sec-head">
          <span className="sec-tag">{t('landing.features.tag')}</span>
          <h2>{t('landing.features.heading')}</h2>
          <p>{t('landing.features.sub')}</p>
        </div>
        <div className="feat-grid">
          {items.map((item, i) => (
            <div key={i} className="feat-item">
              <i className={`fa-solid ${item.icon}`}></i>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
