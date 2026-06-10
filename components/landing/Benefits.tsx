'use client'

import { useT } from '@/lib/i18n/context'

export default function Benefits() {
  const { t } = useT()
  const groups = [
    { key: 'hr', iconClass: 'cyan-icon', icon: 'fa-chart-line' },
    { key: 'managers', iconClass: 'blue-icon', icon: 'fa-users' },
    { key: 'hires', iconClass: 'aqua-icon', icon: 'fa-star' },
  ] as const

  return (
    <section className="section benefits" id="benefits">
      <div className="container">
        <div className="sec-head">
          <span className="sec-tag">{t('landing.benefits.tag')}</span>
          <h2>{t('landing.benefits.heading')}</h2>
          <p>{t('landing.benefits.sub')}</p>
        </div>
        <div className="bene-grid">
          {groups.map(({ key, iconClass, icon }) => (
            <div key={key} className="bene-card">
              <div className={`bene-icon ${iconClass}`}><i className={`fa-solid ${icon}`}></i></div>
              <h3>{t(`landing.benefits.${key}.title` as never)}</h3>
              <ul>
                {[0, 1, 2, 3, 4].map(i => (
                  <li key={i}>
                    <i className="fa-solid fa-check"></i>
                    {t(`landing.benefits.${key}.item${i}` as never)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
