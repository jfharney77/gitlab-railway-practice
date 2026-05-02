export default function Timer({ timeLeft }) {
  const isLow = timeLeft <= 10
  const isCritical = timeLeft <= 5

  return (
    <div className={`timer ${isLow ? 'timer-low' : ''} ${isCritical ? 'timer-critical' : ''}`}>
      <span className="timer-label">TIME</span>
      <span className="timer-value">{timeLeft}</span>
    </div>
  )
}
