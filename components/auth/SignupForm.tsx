'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/db/supabase-client'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'

export default function SignupForm() {
  const { t } = useT()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowser()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'hr', // first user is always HR
          department,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/hr/dashboard')
  }

  return (
    <div className="auth-card">
      <img
        src="/ONBOARD_HERO_LOGO.png"
        alt="OnboardHero"
        className="auth-logo"
      />
      <h2 className="auth-title">{t('auth.signup.title')}</h2>
      <p className="auth-subtitle">{t('auth.signup.subtitle')}</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSignup}>
        <div className="fg">
          <label>{t('auth.signup.fullNameLabel')}</label>
          <input
            type="text"
            placeholder={t('auth.signup.fullNamePlaceholder')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="fg">
          <label>{t('auth.signup.emailLabel')}</label>
          <input
            type="email"
            placeholder={t('auth.signup.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="fg">
          <label>{t('auth.signup.passwordLabel')}</label>
          <input
            type="password"
            placeholder={t('auth.signup.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div className="fg">
          <label>{t('auth.signup.departmentLabel')}</label>
          <input
            type="text"
            placeholder={t('auth.signup.departmentPlaceholder')}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={loading}
        >
          {loading ? t('auth.signup.loadingBtn') : t('auth.signup.submitBtn')}
        </button>
      </form>

      <p className="auth-link">
        {t('auth.signup.hasAccount')} <Link href="/login">{t('auth.signup.loginLink')}</Link>
      </p>
    </div>
  )
}
