import { useState } from 'react'

export default function GuessInput({ onSubmit, disabled }) {
  const [value, setValue] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSubmit(value)
    setValue('')
  }

  return (
    <form className="guess-form" onSubmit={handleSubmit}>
      <span className="dollar-sign">$</span>
      <input
        type="number"
        className="guess-input"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Enter price..."
        min="1"
        step="1"
        disabled={disabled}
        autoFocus
      />
      <button type="submit" className="btn-guess" disabled={disabled || !value}>
        Guess
      </button>
    </form>
  )
}
