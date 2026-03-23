export default function AIInsightBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        background: 'var(--grad-soft)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '22px',
      }}
    >
      <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1.3 }}>&#x2728;</span>
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
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6 }}>{text}</p>
      </div>
    </div>
  )
}
