'use client'

import { useEffect } from 'react'

export default function ScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })

    const targets = document.querySelectorAll('.reveal, .section-reveal, .price-card, .bene-card')
    targets.forEach(t => observer.observe(t))

    return () => observer.disconnect()
  }, [])

  return null
}
