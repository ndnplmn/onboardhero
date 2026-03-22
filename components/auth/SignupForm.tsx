'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/db/supabase-client'
import Link from 'next/link'
import Image from 'next/image'

export default function SignupForm() {
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
      <Image
        src="/ONBOARD_HERO_LOGO.png"
        alt="OnboardHero"
        width={160}
        height={40}
        className="auth-logo"
      />
      <h2 className="auth-title">Create your account</h2>
      <p className="auth-subtitle">Get started with OnboardHero</p>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSignup}>
        <div className="fg">
          <label>Full name</label>
          <input
            type="text"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

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
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div className="fg">
          <label>Department</label>
          <input
            type="text"
            placeholder="e.g. Engineering"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="auth-link">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  )
}
