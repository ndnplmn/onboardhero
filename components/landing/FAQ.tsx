'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/context'

export default function FAQ() {
  const { t } = useT()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const items = [0, 1, 2, 3, 4].map(i => ({
    question: t(`landing.faq.q${i}` as never),
    answer:   t(`landing.faq.a${i}` as never),
  }))

  return (
    <section className="section faq-sec" id="faq">
      <div className="container">
        <div className="sec-head">
          <span className="sec-tag">{t('landing.faq.tag')}</span>
          <h2>{t('landing.faq.heading')}</h2>
        </div>
        <div className="faq-list">
          {items.map((item, i) => (
            <div className={`faq-item${openIndex === i ? ' open' : ''}`} key={i}>
              <button className="faq-q" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                <span>{item.question}</span>
                <i className={`fa-solid ${openIndex === i ? 'fa-minus' : 'fa-plus'}`}></i>
              </button>
              <div className={`faq-a${openIndex === i ? ' open' : ''}`}>
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
