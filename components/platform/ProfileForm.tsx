'use client'

import { useTransition, useState } from 'react'
import { updateProfile } from '@/app/(platform)/hire/actions'

interface Props {
  profile: {
    id: string
    full_name: string
    email: string
    phone: string | null
    bio: string | null
    emergency_contact: { name?: string; phone?: string; relationship?: string } | null
    avatar_url: string | null
  }
}

export default function ProfileForm({ profile }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('id', profile.id)
    startTransition(async () => {
      await updateProfile(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const ec = profile.emergency_contact || {}

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
        <img
          src={profile.avatar_url || `https://i.pravatar.cc/80?u=${profile.id}`}
          alt="avatar"
          style={{ width: '80px', height: '80px', borderRadius: '50%' }}
        />
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '4px' }}>{profile.full_name}</h2>
          <span style={{ color: 'var(--text3)' }}>{profile.email}</span>
        </div>
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '12px' }}>Personal Info</h3>
      <div className="fg">
        <label>Full Name</label>
        <input name="full_name" type="text" defaultValue={profile.full_name} required />
      </div>
      <div className="fg">
        <label>Phone</label>
        <input name="phone" type="tel" defaultValue={profile.phone || ''} placeholder="+1 555 123 4567" />
      </div>
      <div className="fg">
        <label>Bio</label>
        <textarea name="bio" defaultValue={profile.bio || ''} placeholder="Tell your team about yourself..."
          style={{ minHeight: '80px', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface)', width: '100%', resize: 'vertical' }} />
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', margin: '24px 0 12px' }}>Emergency Contact</h3>
      <div className="fg">
        <label>Name</label>
        <input name="ec_name" type="text" defaultValue={ec.name || ''} placeholder="Contact name" />
      </div>
      <div className="fg">
        <label>Phone</label>
        <input name="ec_phone" type="tel" defaultValue={ec.phone || ''} placeholder="+1 555 987 6543" />
      </div>
      <div className="fg">
        <label>Relationship</label>
        <input name="ec_relationship" type="text" defaultValue={ec.relationship || ''} placeholder="Spouse, Parent, etc." />
      </div>

      <button type="submit" className="btn btn-primary" disabled={isPending} style={{ marginTop: '16px' }}>
        {isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
      </button>
    </form>
  )
}
