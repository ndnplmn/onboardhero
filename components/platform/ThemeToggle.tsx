'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('oh-theme') as Theme | null
    const initial = stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    apply(initial)
  }, [])

  function apply(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('oh-theme', t)
    setTheme(t)
  }

  function toggle() {
    apply(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      <i className={`fa-solid fa-${theme === 'dark' ? 'sun' : 'moon'}`} style={{ fontSize: 11 }} />
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
