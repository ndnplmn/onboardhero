import ChatWindow from '@/components/ai/ChatWindow'

export const dynamic = 'force-dynamic'

export default function ChatPage() {
  return (
    <div>
      <div style={{ padding: '32px 32px 0' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>AI Assistant</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Ask me anything about your onboarding journey</p>
      </div>
      <ChatWindow />
    </div>
  )
}
