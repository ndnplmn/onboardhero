'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/db/supabase-client'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginForm() {
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
    <div className="auth-card">
      <Image
        src="/ONBOARD_HERO_LOGO.png"
        alt="OnboardHero"
        width={160}
        height={40}
        className="auth-logo"
      />
      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-subtitle">Log in to your OnboardHero account</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleLogin}>
        <div className="fg">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="fg">
          <label>Password</label>
          <input
            type="password"
            placeholder="Your password"
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
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="auth-link">
        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
      </p>
    </div>
  )
}
