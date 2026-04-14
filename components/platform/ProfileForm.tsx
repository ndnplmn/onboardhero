'use client'

import { useTransition, useState, useRef } from 'react'
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
    department?: string | null
    role?: string
  }
}

export default function ProfileForm({ profile }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved]   = useState(false)
  const [avatarSrc, setAvatarSrc] = useState<string>(
    profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Preview immediately using object URL
    const url = URL.createObjectURL(file)
    setAvatarSrc(url)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('id', profile.id)
    // Attach the avatar file if one was selected
    const file = fileInputRef.current?.files?.[0]
    if (file) formData.set('avatar_file', file)
    startTransition(async () => {
      await updateProfile(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const ec = profile.emergency_contact || {}

  const roleLabel: Record<string, string> = {
    hr: 'HR Manager',
    manager: 'Team Manager',
    new_hire: 'New Hire',
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Avatar section */}
      <div className="db-card" style={{ padding: '28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Avatar with upload overlay */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={avatarSrc}
              alt="Profile photo"
              style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload new profile photo"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--blue)', border: '2px solid var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', fontSize: 11,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--cyan)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--blue)')}
            >
              <i className="fa-solid fa-camera" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{profile.full_name}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, color: 'var(--text3)' }}>
              <span><i className="fa-solid fa-envelope" style={{ marginRight: 6, width: 12 }} />{profile.email}</span>
              {profile.department && <span><i className="fa-solid fa-building" style={{ marginRight: 6, width: 12 }} />{profile.department}</span>}
              {profile.role && <span><i className="fa-solid fa-id-badge" style={{ marginRight: 6, width: 12 }} />{roleLabel[profile.role] ?? profile.role}</span>}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fa-solid fa-image" style={{ marginRight: 6 }} />Change Photo
          </button>
        </div>

        {avatarSrc !== (profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`) && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-circle-info" />
            New photo selected — save your profile to apply it.
          </div>
        )}
      </div>

      {/* Personal Info */}
      <div className="db-card" style={{ padding: '24px', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
          <i className="fa-solid fa-user" style={{ marginRight: 8, color: 'var(--blue)' }} />Personal Info
        </h3>
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
          <textarea
            name="bio"
            defaultValue={profile.bio || ''}
            placeholder="Tell your team a bit about yourself, your background, and what you're working on..."
            style={{ minHeight: '90px', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface)', width: '100%', resize: 'vertical', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="db-card" style={{ padding: '24px', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
          <i className="fa-solid fa-heart-pulse" style={{ marginRight: 8, color: 'var(--red)' }} />Emergency Contact
        </h3>
        <div className="fg">
          <label>Contact Name</label>
          <input name="ec_name" type="text" defaultValue={ec.name || ''} placeholder="Full name" />
        </div>
        <div className="fg">
          <label>Phone</label>
          <input name="ec_phone" type="tel" defaultValue={ec.phone || ''} placeholder="+1 555 987 6543" />
        </div>
        <div className="fg">
          <label>Relationship</label>
          <input name="ec_relationship" type="text" defaultValue={ec.relationship || ''} placeholder="Spouse, Parent, Sibling…" />
        </div>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? (
            <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }} />Saving…</>
          ) : saved ? (
            <><i className="fa-solid fa-check" style={{ marginRight: 6 }} />Saved!</>
          ) : (
            <><i className="fa-solid fa-floppy-disk" style={{ marginRight: 6 }} />Save Profile</>
          )}
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-circle-check" />Changes saved successfully.
          </span>
        )}
      </div>
    </form>
  )
}
