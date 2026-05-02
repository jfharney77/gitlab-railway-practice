import { useEffect, useRef } from 'react'

export default function ChatBox({ messages, loading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="chatbox">
      {messages.map(msg => (
        <div key={msg.id} className={`message message-${msg.from} message-type-${msg.type}`}>
          <span className="message-label">{msg.from === 'host' ? 'Host' : 'You'}</span>
          <span className="message-text">{msg.text}</span>
        </div>
      ))}
      {loading && (
        <div className="message message-host message-type-normal">
          <span className="message-label">Host</span>
          <span className="message-text typing">...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
