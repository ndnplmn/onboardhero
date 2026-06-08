'use client'

interface CompletionCertificateProps {
  hireName:     string
  managerName?: string
  department?:  string
  completedAt?: string
  journeyId?:   string
}

export default function CompletionCertificate({ hireName, managerName, department, completedAt, journeyId }: CompletionCertificateProps) {
  const completedDate = completedAt
    ? new Date(completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  function printCertificate() {
    const win = window.open('', '_blank', 'width=900,height=650')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Onboarding Certificate — ${hireName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Playfair+Display:wght@700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif; }
  .cert { width: 820px; padding: 56px 64px; border: 3px solid #1A6CF6; border-radius: 12px; position: relative; overflow: hidden; }
  .cert::before { content: ''; position: absolute; inset: 8px; border: 1px solid rgba(26,108,246,0.2); border-radius: 8px; pointer-events: none; }
  .corner { position: absolute; width: 48px; height: 48px; border-color: #1A6CF6; border-style: solid; }
  .tl { top: 16px; left: 16px; border-width: 2px 0 0 2px; }
  .tr { top: 16px; right: 16px; border-width: 2px 2px 0 0; }
  .bl { bottom: 16px; left: 16px; border-width: 0 0 2px 2px; }
  .br { bottom: 16px; right: 16px; border-width: 0 2px 2px 0; }
  .logo { text-align: center; margin-bottom: 24px; }
  .logo span { font-size: 11px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; color: #1A6CF6; }
  .divider { height: 1px; background: linear-gradient(90deg, transparent, #1A6CF6, transparent); margin: 16px 0; }
  .headline { text-align: center; margin: 20px 0 8px; font-family: 'Playfair Display', Georgia, serif; font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #64748b; }
  .title { text-align: center; font-family: 'Playfair Display', Georgia, serif; font-size: 38px; font-weight: 900; color: #0f172a; line-height: 1.15; margin-bottom: 28px; }
  .presented { text-align: center; font-size: 13px; color: #64748b; margin-bottom: 10px; letter-spacing: 0.05em; }
  .name { text-align: center; font-family: 'Playfair Display', Georgia, serif; font-size: 44px; font-weight: 700; color: #1A6CF6; margin-bottom: 24px; letter-spacing: -0.01em; }
  .body { text-align: center; font-size: 14px; color: #334155; line-height: 1.7; max-width: 540px; margin: 0 auto 32px; }
  .meta { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
  .sig { display: flex; flex-direction: column; gap: 4px; }
  .sig-line { width: 180px; height: 1px; background: #0f172a; margin-bottom: 6px; }
  .sig-name { font-size: 13px; font-weight: 700; color: #0f172a; }
  .sig-role { font-size: 11px; color: #64748b; }
  .seal { text-align: center; }
  .seal-circle { width: 72px; height: 72px; border-radius: 50%; border: 2px solid #1A6CF6; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px; }
  .seal-icon { font-size: 28px; }
  .seal-text { font-size: 9px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #1A6CF6; }
  .date-block { text-align: right; }
  .date-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
  .date-value { font-size: 14px; font-weight: 700; color: #0f172a; }
  @media print { body { background: white; } .cert { border-color: #1A6CF6; } }
</style>
</head>
<body>
<div class="cert">
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>
  <div class="logo"><span>⬡ Onboard Hero</span></div>
  <div class="divider"></div>
  <p class="headline">Certificate of Completion</p>
  <h1 class="title">Onboarding Journey<br>Successfully Completed</h1>
  <p class="presented">This certificate is proudly presented to</p>
  <p class="name">${hireName}</p>
  <p class="body">
    for successfully completing the 90-day onboarding program${department ? ` in the <strong>${department}</strong> department` : ''},
    demonstrating commitment, adaptability, and the drive to contribute meaningfully from day one.
  </p>
  <div class="divider"></div>
  <div class="meta">
    <div class="sig">
      <div class="sig-line"></div>
      <div class="sig-name">${managerName ?? 'Your Manager'}</div>
      <div class="sig-role">Direct Manager</div>
    </div>
    <div class="seal">
      <div class="seal-circle"><span class="seal-icon">🏆</span></div>
      <div class="seal-text">Verified</div>
    </div>
    <div class="date-block">
      <div class="date-label">Date Awarded</div>
      <div class="date-value">${completedDate}</div>
    </div>
  </div>
</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`)
    win.document.close()
  }

  return (
    <div className="db-card" style={{ overflow: 'hidden', borderTop: '3px solid var(--green)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--green) 4%, var(--surface)), var(--surface))' }}>
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-trophy" style={{ color: 'var(--amber)', marginRight: 7 }} aria-hidden="true" />
          Onboarding Complete!
        </h3>
        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 100, background: 'color-mix(in srgb, var(--green) 15%, transparent)', color: 'var(--green)', border: '1px solid color-mix(in srgb, var(--green) 30%, transparent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Certified
        </span>
      </div>
      <div className="db-card-bd">
        {/* Certificate preview */}
        <div style={{
          border: '2px solid var(--green)',
          borderRadius: 'var(--r)',
          padding: '28px 32px',
          textAlign: 'center',
          position: 'relative',
          background: 'var(--surface)',
          marginBottom: 14,
        }}>
          {/* Corner decorations */}
          {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => (
            <div key={pos} style={{
              position: 'absolute',
              width: 16, height: 16,
              top:    pos.includes('top')    ? 8 : undefined,
              bottom: pos.includes('bottom') ? 8 : undefined,
              left:   pos.includes('left')   ? 8 : undefined,
              right:  pos.includes('right')  ? 8 : undefined,
              borderTop:    pos.includes('top')    ? '2px solid var(--green)' : undefined,
              borderBottom: pos.includes('bottom') ? '2px solid var(--green)' : undefined,
              borderLeft:   pos.includes('left')   ? '2px solid var(--green)' : undefined,
              borderRight:  pos.includes('right')  ? '2px solid var(--green)' : undefined,
            }} />
          ))}

          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>
            Certificate of Completion
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: 6, lineHeight: 1.2 }}>
            {hireName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
            Successfully completed the 90-day onboarding journey{department ? ` · ${department}` : ''}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Awarded</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{completedDate}</div>
            </div>
            {managerName && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Manager</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{managerName}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={printCertificate}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, fontSize: 12 }}
          >
            <i className="fa-solid fa-download" style={{ marginRight: 5 }} />
            Download Certificate
          </button>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://onboardhero.app')}&summary=${encodeURIComponent(`I just completed my 90-day onboarding journey${department ? ` in ${department}` : ''}! Proud to have earned my completion certificate through OnboardHero. 🎉`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
            style={{ fontSize: 12, textDecoration: 'none' }}
          >
            <i className="fa-brands fa-linkedin" style={{ marginRight: 5 }} />
            Share on LinkedIn
          </a>
        </div>
      </div>
    </div>
  )
}
