import ChatWindow from '@/components/ai/ChatWindow'

export const dynamic = 'force-dynamic'

export default function ChatPage() {
  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i
              className="fa-solid fa-robot"
              style={{
                marginRight: 8,
                background: 'var(--grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              aria-hidden="true"
            />
            AI Assistant
          </h1>
          <p>Ask me anything about your onboarding journey, tools, or team.</p>
        </div>
      </div>
      <div className="db-body">
        <ChatWindow />
      </div>
    </>
  )
}
