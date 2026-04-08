export default function AIInsightBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        background: 'var(--grad-soft)',
        border: '1px solid var(--blue-light)',
        borderRadius: 'var(--r-lg)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '22px',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--r)',
          background: 'var(--grad)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <i className="fa-solid fa-sparkles" style={{ fontSize: '13px', color: '#fff' }} />
      </div>
      <div>
        <strong
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '4px',
            background: 'var(--grad)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          AI Insight
        </strong>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>{text}</p>
      </div>
    </div>
  )
}
