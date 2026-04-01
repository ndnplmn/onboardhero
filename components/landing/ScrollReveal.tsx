'use client'

import { useEffect } from 'react'

export default function ScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
        }
      })
    }, { threshold: 0.1 })

    const targets = document.querySelectorAll('.reveal, .section-reveal, .price-card, .bene-card')
    targets.forEach(t => observer.observe(t))

    return () => observer.disconnect()
  }, [])

  return null
}
