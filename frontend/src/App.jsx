import { useEffect, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
import ChatBox from './components/ChatBox'
import GuessInput from './components/GuessInput'
import Timer from './components/Timer'

export default function App() {
  const [phase, setPhase] = useState('idle') // idle | playing | ended
  const [gameId, setGameId] = useState(null)
  const [productName, setProductName] = useState('')
  const [messages, setMessages] = useState([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [loading, setLoading] = useState(false)
  const gameActiveRef = useRef(false)

  useEffect(() => {
    if (phase !== 'playing') return
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (timeLeft === 0 && phase === 'playing') {
      gameActiveRef.current = false
      setPhase('ended')
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          from: 'host',
          type: 'you_lose',
          text: "Ding ding ding! Time's up! The clock has run out. Better luck next time!",
        },
      ])
    }
  }, [timeLeft, phase])

  const addMessage = (text, from, type = 'normal') => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), from, text, type }])
  }

  const startGame = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/game/start`, { method: 'POST' })
      const data = await res.json()
      gameActiveRef.current = true
      setGameId(data.game_id)
      setProductName(data.product_name)
      setTimeLeft(30)
      setMessages([
        {
          id: Date.now(),
          from: 'host',
          type: 'normal',
          text: `Welcome to The Clock Game! Today's item is the ${data.product_name}. You have 30 seconds to guess the price. Your clock starts NOW!`,
        },
      ])
      setPhase('playing')
    } catch (e) {
      console.error('Failed to start game:', e)
    }
  }

  const submitGuess = async guess => {
    if (!gameActiveRef.current || loading) return
    const numGuess = parseFloat(guess)
    if (isNaN(numGuess) || numGuess <= 0) return

    addMessage(`$${Math.round(numGuess)}`, 'player')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/game/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, guess: numGuess }),
      })
      const data = await res.json()

      if (!gameActiveRef.current) return

      addMessage(data.message, 'host', data.result)

      if (data.result === 'you_win' || data.result === 'you_lose') {
        gameActiveRef.current = false
        setPhase('ended')
      }
    } catch (e) {
      console.error('Guess failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const resetGame = () => {
    gameActiveRef.current = false
    setPhase('idle')
    setGameId(null)
    setProductName('')
    setMessages([])
    setTimeLeft(30)
    setLoading(false)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>The Clock Game</h1>
        <p className="subtitle">Guess the price before time runs out!</p>
      </header>

      <main className="game-container">
        {phase === 'idle' && (
          <div className="start-screen">
            <div className="start-card">
              <h2>Ready to play?</h2>
              <p>You have 30 seconds to guess the exact price of a mystery item.</p>
              <p>
                Too low? I'll say <span className="hint-higher">HIGHER</span>.
              </p>
              <p>
                Too high? I'll say <span className="hint-lower">LOWER</span>.
              </p>
              <button className="btn-primary" onClick={startGame}>
                Start Game
              </button>
            </div>
          </div>
        )}

        {phase !== 'idle' && (
          <>
            <div className="game-header">
              <div className="product-display">
                <span className="product-label">Today's Item</span>
                <span className="product-name">{productName}</span>
              </div>
              <Timer timeLeft={timeLeft} />
            </div>

            <ChatBox messages={messages} loading={loading} />

            {phase === 'playing' && (
              <GuessInput onSubmit={submitGuess} disabled={loading} />
            )}

            {phase === 'ended' && (
              <div className="game-over">
                <button className="btn-primary" onClick={resetGame}>
                  Play Again
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
