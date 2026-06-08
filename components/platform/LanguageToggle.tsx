'use client'

import { useT } from '@/lib/i18n/context'

export default function LanguageToggle() {
  const { lang, setLang } = useT()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 6px',
        borderRadius: 'var(--r)',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        userSelect: 'none',
      }}
      role="group"
      aria-label="Language selector"
    >
      {(['en', 'es'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          aria-label={l === 'en' ? 'Switch to English' : 'Cambiar a Español'}
          style={{
            padding: '3px 10px',
            borderRadius: 'calc(var(--r) - 2px)',
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            transition: 'background 0.15s, color 0.15s',
            background: lang === l
              ? 'var(--grad)'
              : 'transparent',
            color: lang === l ? '#fff' : 'var(--text3)',
            WebkitBackgroundClip: lang === l ? 'unset' : undefined,
            WebkitTextFillColor: lang === l ? '#fff' : undefined,
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
