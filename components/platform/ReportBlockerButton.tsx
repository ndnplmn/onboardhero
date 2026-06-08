'use client'

import { useState, useTransition, useEffect } from 'react'
import { reportFrictionPoint } from '@/app/(platform)/hire/actions'
import { useT } from '@/lib/i18n/context'

const BLOCKER_TYPES = [
  { value: 'technical',    tKey: 'technical',    icon: 'fa-solid fa-laptop-code' },
  { value: 'role_clarity', tKey: 'roleClarity',  icon: 'fa-solid fa-compass' },
  { value: 'culture',      tKey: 'culture',      icon: 'fa-solid fa-users' },
  { value: 'engagement',   tKey: 'engagement',   icon: 'fa-solid fa-bolt' },
  { value: 'mentorship',   tKey: 'mentorship',   icon: 'fa-solid fa-handshake-angle' },
] as const

type BlockerType = typeof BLOCKER_TYPES[number]['value']

interface ReportBlockerButtonProps {
  journeyId: string
}

export default function ReportBlockerButton({ journeyId }: ReportBlockerButtonProps) {
  const { t } = useT()
  const [open, setOpen]             = useState(false)
  const [step, setStep]             = useState<'type' | 'desc' | 'done'>('type')
  const [selectedType, setSelected] = useState<BlockerType | null>(null)
  const [description, setDesc]      = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    function onOpenEvent() { setOpen(true) }
    window.addEventListener('open-blocker-modal', onOpenEvent)
    return () => window.removeEventListener('open-blocker-modal', onOpenEvent)
  }, [])

  function reset() {
    setStep('type')
    setSelected(null)
    setDesc('')
    setOpen(false)
  }

  function submit() {
    if (!selectedType || !description.trim()) return
    startTransition(async () => {
      await reportFrictionPoint(journeyId, selectedType, description.trim())
      setStep('done')
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontSize: 12, fontWeight: 700,
          padding: '8px 16px', borderRadius: 'var(--r)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--text2)', cursor: 'pointer',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--amber)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--amber)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)' }}
      >
        <i className="fa-solid fa-flag" style={{ fontSize: 11 }} />
        {t('components.reportBlocker.buttonLabel')}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('components.reportBlocker.titleReport')}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)', padding: '20px',
          }}
          onClick={e => { if (e.target === e.currentTarget) reset() }}
        >
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 480,
            padding: '28px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  {step === 'done' ? t('components.reportBlocker.titleDone') : t('components.reportBlocker.titleReport')}
                </div>
                {step !== 'done' && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    {t('components.reportBlocker.notifyDesc')}
                  </div>
                )}
              </div>
              <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, fontSize: 16 }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Step 1: choose type */}
            {step === 'type' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>
                  {t('components.reportBlocker.typeQuestion')}
                </div>
                {BLOCKER_TYPES.map(blocker => (
                  <button
                    key={blocker.value}
                    onClick={() => { setSelected(blocker.value); setStep('desc') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 'var(--r)',
                      background: selectedType === blocker.value ? 'var(--blue-light, rgba(26,108,246,0.08))' : 'var(--surface2)',
                      border: `1px solid ${selectedType === blocker.value ? 'var(--blue)' : 'var(--border)'}`,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={blocker.icon} style={{ fontSize: 13, color: 'var(--blue)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                        {t(`components.reportBlocker.types.${blocker.tKey}.label`)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {t(`components.reportBlocker.types.${blocker.tKey}.desc`)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: describe */}
            {step === 'desc' && selectedType && (
              <div>
                <button
                  onClick={() => setStep('type')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 12, padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <i className="fa-solid fa-arrow-left" style={{ fontSize: 10 }} />
                  {t(`components.reportBlocker.types.${BLOCKER_TYPES.find(b => b.value === selectedType)!.tKey}.label`)}
                </button>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>
                  {t('components.reportBlocker.descLabel')}
                </label>
                <textarea
                  autoFocus
                  value={description}
                  onChange={e => setDesc(e.target.value)}
                  placeholder={t('components.reportBlocker.descPlaceholder')}
                  rows={4}
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: 13,
                    borderRadius: 'var(--r)', border: '1px solid var(--border)',
                    background: 'var(--surface2)', color: 'var(--text)',
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit', lineHeight: 1.5,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                  <button onClick={() => setStep('type')} className="btn btn-ghost btn-sm">{t('components.reportBlocker.cancel')}</button>
                  <button
                    onClick={submit}
                    disabled={isPending || !description.trim()}
                    className="btn btn-primary btn-sm"
                    style={{ opacity: (!description.trim() || isPending) ? 0.5 : 1 }}
                  >
                    {isPending
                      ? <><i className="fa-solid fa-spinner fa-spin" /> {t('components.reportBlocker.sending')}</>
                      : <><i className="fa-solid fa-paper-plane" /> {t('components.reportBlocker.sendToManager')}</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: done */}
            {step === 'done' && (
              <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', background: 'rgba(34,197,94,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 24, color: 'var(--green)' }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
                  {t('components.reportBlocker.doneTitle')}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.55, marginBottom: 20 }}>
                  {t('components.reportBlocker.doneDesc')}
                </p>
                <button onClick={reset} className="btn btn-primary btn-sm">{t('components.reportBlocker.done')}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
