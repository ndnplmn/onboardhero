'use client'

import { useState } from 'react'

const faqData = [
  {
    question: 'How long does it take to set up OnboardHero?',
    answer: 'Most HR teams are up and running within a single day. Our onboarding wizard guides you through creating your first journey template, inviting your team, and launching your first new hire\u2019s journey \u2014 all in under 2 hours.',
  },
  {
    question: 'Can I customize the journey stages and tasks?',
    answer: 'Absolutely. Professional and Enterprise plans offer full control over structure \u2014 add, remove, or rename stages; create role-specific task templates; and set conditional triggers based on department, level, or location.',
  },
  {
    question: 'Does OnboardHero integrate with our existing HRIS?',
    answer: 'Yes. We integrate with Workday, BambooHR, Personio, Rippling, and others. API access is available on all plans for custom integrations.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'All plans include a 14-day free trial with no credit card required. You\u2019ll have full access so you can evaluate OnboardHero with your real team before committing.',
  },
  {
    question: 'How does the new hire experience work?',
    answer: 'New hires get a personalized welcome with access to their own dashboard, showing their complete 90-day roadmap, tasks, resources, and contacts \u2014 all in one place designed specifically for them.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="section faq-sec" id="faq">
      <div className="container">
        <div className="sec-head">
          <span className="sec-tag">FAQ</span>
          <h2>Frequently asked questions</h2>
        </div>
        <div className="faq-list">
          {faqData.map((item, i) => (
            <div className={`faq-item${openIndex === i ? ' open' : ''}`} key={i}>
              <button className="faq-q" onClick={() => toggle(i)}>
                <span>{item.question}</span>
                <i className={`fa-solid ${openIndex === i ? 'fa-minus' : 'fa-plus'}`}></i>
              </button>
              <div className="faq-a">
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
