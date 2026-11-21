// "How was it?" — five tappable stars, one radio group for keyboard and screen readers.
export default function StarRating({ value, onChange, label = 'Rating' }) {
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(5, (value ?? 0) + 1))
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(1, (value ?? 2) - 1))
    else return
    e.preventDefault()
  }
  return (
    <div className="star-input" role="radiogroup" aria-label={label} onKeyDown={onKeyDown}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          tabIndex={value === n || (!value && n === 1) ? 0 : -1}
          className={value >= n ? 'is-on' : ''}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  )
}
