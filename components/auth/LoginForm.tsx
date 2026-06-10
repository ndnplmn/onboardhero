'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/db/supabase-client'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'
import LanguageToggle from '@/components/platform/LanguageToggle'

export default function LoginForm() {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const redirectMap: Record<string, string> = {
      hr: '/hr/dashboard',
      manager: '/manager/dashboard',
      new_hire: '/hire/dashboard',
    }
    router.push(redirectMap[profile?.role || 'hr'] || '/hr/dashboard')
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <LanguageToggle />
      </div>
      <div className="auth-card">
      <img
        src="/ONBOARD_HERO_LOGO.png"
        alt="OnboardHero"
        className="auth-logo"
      />
      <h2 className="auth-title">{t('auth.login.title')}</h2>
      <p className="auth-subtitle">{t('auth.login.subtitle')}</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleLogin}>
        <div className="fg">
          <label>{t('auth.login.emailLabel')}</label>
          <input
            type="email"
            placeholder={t('auth.login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="fg">
          <label>{t('auth.login.passwordLabel')}</label>
          <input
            type="password"
            placeholder={t('auth.login.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={loading}
        >
          {loading ? t('auth.login.loadingBtn') : t('auth.login.submitBtn')}
        </button>
      </form>

      <p className="auth-link">
        {t('auth.login.noAccount')} <Link href="/signup">{t('auth.login.signupLink')}</Link>
      </p>
    </div>
    </>
  )
}
