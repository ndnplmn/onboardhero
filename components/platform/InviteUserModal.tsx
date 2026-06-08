'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { inviteUser } from '@/app/(platform)/hr/employees/actions'
import { useT } from '@/lib/i18n/context'

interface Props {
  managers: { id: string; full_name: string }[]
  templates: { id: string; name: string }[]
  onClose: () => void
}

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'People', 'Finance', 'Legal', 'Operations']

export default function InviteUserModal({ managers, templates, onClose }: Props) {
  const { t } = useT()
  const [role, setRole]           = useState('new_hire')
  const [isPending, startTransition] = useTransition()
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [invitedName, setInvitedName] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('full_name') as string
    setError('')
    startTransition(async () => {
      const result = await inviteUser(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setInvitedName(name)
        setSuccess(true)
      }
    })
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(13,21,41,0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: 20,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 500,
          background: 'var(--surface)',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--r)',
            background: 'var(--blue-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <i className="fa-solid fa-user-plus" style={{ fontSize: 16, color: 'var(--blue)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
              {t('components.inviteModal.title')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              They&apos;ll receive an email invitation to set up their account.
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--text3)', padding: '6px 8px' }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'var(--green-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <i className="fa-solid fa-envelope-circle-check" style={{ fontSize: 24, color: 'var(--green)' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              Invitation Sent!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>
              <strong>{invitedName}</strong> will receive an email to set up their account.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ flex: 1 }}
                onClick={() => { setSuccess(false); setRole('new_hire'); setError('') }}
              >
                Invite Another
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{
                  background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 'var(--r)', padding: '10px 14px',
                  fontSize: 13, color: 'var(--red)',
                }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }} />{error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="fg">
                  <label>{t('components.inviteModal.fullNameLabel')}</label>
                  <input name="full_name" type="text" placeholder={t('components.inviteModal.fullNamePlaceholder')} required />
                </div>
                <div className="fg">
                  <label>{t('components.inviteModal.emailLabel')}</label>
                  <input name="email" type="email" placeholder={t('components.inviteModal.emailPlaceholder')} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="fg">
                  <label>{t('components.inviteModal.roleLabel')}</label>
                  <select name="role" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="new_hire">{t('components.inviteModal.newHire')}</option>
                    <option value="manager">{t('components.inviteModal.manager')}</option>
                    <option value="hr">{t('components.inviteModal.hr')}</option>
                  </select>
                </div>
                <div className="fg">
                  <label>{t('components.inviteModal.departmentLabel')}</label>
                  <select name="department">
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {role === 'new_hire' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    padding: '14px 16px',
                    background: 'var(--grad-soft)',
                    border: '1px solid var(--blue-light)',
                    borderRadius: 'var(--r)',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <i className="fa-solid fa-route" style={{ marginRight: 6 }} />
                      Onboarding Setup
                    </div>

                    <div className="fg" style={{ margin: 0 }}>
                      <label>{t('components.inviteModal.managerLabel')}</label>
                      {managers.length > 0 ? (
                        <select name="manager_id" required>
                          <option value="">{t('components.inviteModal.selectManager')}</option>
                          {managers.map(m => (
                            <option key={m.id} value={m.id}>{m.full_name}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{
                          padding: '10px 14px', borderRadius: 'var(--r)',
                          border: '1px solid var(--border)', background: 'var(--bg)',
                          fontSize: 12, color: 'var(--text3)',
                        }}>
                          <i className="fa-solid fa-info-circle" style={{ marginRight: 6 }} />
                          No managers found — <a href="/hr/employees" style={{ color: 'var(--blue)' }}>invite a manager first</a>
                        </div>
                      )}
                    </div>

                    <div className="fg" style={{ margin: 0 }}>
                      <label>{t('components.inviteModal.templateLabel')}</label>
                      {templates.length > 0 ? (
                        <select name="template_id" required>
                          <option value="">{t('components.inviteModal.selectTemplate')}</option>
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{
                          padding: '10px 14px', borderRadius: 'var(--r)',
                          border: '1px solid var(--border)', background: 'var(--bg)',
                          fontSize: 12, color: 'var(--text3)',
                        }}>
                          <i className="fa-solid fa-info-circle" style={{ marginRight: 6 }} />
                          No templates found — <a href="/hr/journeys" style={{ color: 'var(--blue)' }}>create a template first</a>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex', gap: 10,
              background: 'var(--surface2)',
            }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={onClose}
                style={{ flex: 1 }}
              >
                {t('components.inviteModal.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isPending || (role === 'new_hire' && (managers.length === 0 || templates.length === 0))}
                style={{ flex: 2 }}
              >
                {isPending
                  ? <><i className="fa-solid fa-spinner fa-spin" /> {t('components.inviteModal.sending')}</>
                  : <><i className="fa-solid fa-paper-plane" /> {t('components.inviteModal.sendInvite')}</>
                }
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
