'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { updateEmployee, deactivateEmployee } from '@/app/(platform)/hr/employees/actions'

interface Props {
  employee: {
    id: string
    full_name: string
    email: string
    role: string
    department: string
    active: boolean
  }
  managers: { id: string; full_name: string }[]
  onClose: () => void
}

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing', 'People', 'Finance', 'Legal', 'Operations']

const ROLE_CONFIG = {
  new_hire: { label: 'New Hire', color: 'var(--cyan)',  bg: 'var(--cyan-light)',  icon: 'fa-solid fa-person' },
  manager:  { label: 'Manager',  color: 'var(--blue)',  bg: 'var(--blue-light)',  icon: 'fa-solid fa-user-tie' },
  hr:       { label: 'HR',       color: 'var(--aqua)',  bg: 'var(--aqua-light)',  icon: 'fa-solid fa-id-badge' },
}

export default function EditEmployeeModal({ employee, managers, onClose }: Props) {
  const [role, setRole]                   = useState(employee.role)
  const [active, setActive]               = useState(employee.active ?? true)
  const [isPending, startTransition]      = useTransition()
  const [isDeactivating, startDeactivate] = useTransition()
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('active', active ? 'true' : 'false')
    setError('')
    startTransition(async () => {
      const result = await updateEmployee(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(onClose, 1400)
      }
    })
  }

  function handleDeactivate() {
    startDeactivate(async () => {
      await deactivateEmployee(employee.id)
      onClose()
    })
  }

  const rc = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.new_hire

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
          width: '100%', maxWidth: 480,
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
          <img
            src={`https://i.pravatar.cc/150?u=${employee.id}`}
            alt={employee.full_name}
            style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {employee.full_name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{employee.email}</div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--text3)', padding: '6px 8px', flexShrink: 0 }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--green-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 24, color: 'var(--green)' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Changes Saved</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Employee profile has been updated.</div>
          </div>
        ) : (
          <>
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

                <input type="hidden" name="id" value={employee.id} />

                <div className="fg">
                  <label>Full Name</label>
                  <input name="full_name" type="text" defaultValue={employee.full_name} required />
                </div>

                <div className="fg">
                  <label>Email</label>
                  <input
                    name="email" type="email" value={employee.email} disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, display: 'block' }}>
                    Email cannot be changed after account creation.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="fg">
                    <label>Role</label>
                    <select name="role" value={role} onChange={e => setRole(e.target.value)}>
                      <option value="new_hire">New Hire</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR</option>
                    </select>
                  </div>
                  <div className="fg">
                    <label>Department</label>
                    <select name="department" defaultValue={employee.department || ''}>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Role preview */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 100, width: 'fit-content',
                  background: rc.bg, color: rc.color,
                  fontSize: 11, fontWeight: 700,
                }}>
                  <i className={rc.icon} style={{ fontSize: 10 }} />
                  Will be set as {rc.label}
                </div>

                {/* Account status toggle */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 'var(--r)',
                  border: '1px solid var(--border)',
                  background: active ? 'var(--green-bg)' : 'var(--red-bg)',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--green)' : 'var(--red)' }}>
                      <i className={`fa-solid ${active ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ marginRight: 6 }} />
                      Account {active ? 'Active' : 'Inactive'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      {active ? 'This person can log in and access the platform.' : 'This person cannot access the platform.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive(v => !v)}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: active ? 'var(--green)' : 'var(--border2)',
                      border: 'none', cursor: 'pointer',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3,
                      left: active ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#fff', transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              </div>

              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border)',
                display: 'flex', gap: 10,
                background: 'var(--surface2)',
              }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setConfirmDeactivate(true)}
                  style={{ color: 'var(--red)', fontSize: 11 }}
                  title="Deactivate account"
                >
                  <i className="fa-solid fa-user-slash" />
                </button>
                <div style={{ flex: 1 }} />
                <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isPending} style={{ minWidth: 110 }}>
                  {isPending
                    ? <><i className="fa-solid fa-spinner fa-spin" /> Saving...</>
                    : <><i className="fa-solid fa-floppy-disk" /> Save Changes</>
                  }
                </button>
              </div>
            </form>

            {/* Deactivate confirmation */}
            <AnimatePresence>
              {confirmDeactivate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(13,21,41,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--r-xl)',
                    zIndex: 10,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    style={{
                      background: 'var(--surface)',
                      borderRadius: 'var(--r-xl)',
                      border: '1px solid var(--border)',
                      padding: '28px 24px',
                      margin: 20, textAlign: 'center',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'var(--red-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}>
                      <i className="fa-solid fa-user-slash" style={{ fontSize: 20, color: 'var(--red)' }} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                      Deactivate Account?
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20, lineHeight: 1.5 }}>
                      <strong>{employee.full_name}</strong> will lose access immediately.
                      Their data and journey history will be preserved.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => setConfirmDeactivate(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{
                          flex: 1,
                          background: 'var(--red)', color: '#fff',
                          border: 'none', cursor: 'pointer',
                        }}
                        disabled={isDeactivating}
                        onClick={handleDeactivate}
                      >
                        {isDeactivating
                          ? <><i className="fa-solid fa-spinner fa-spin" /> Deactivating...</>
                          : 'Yes, Deactivate'
                        }
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  )
}
