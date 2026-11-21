// Up to three overlapping avatars, then "+N" (list members, or the people who saved a dish).
import Avatar from './Avatar'

export default function AvatarStack({ people, total = people.length, size = 26, max = 3 }) {
  const shown = people.slice(0, max)
  const more = total - shown.length
  return (
    <span className="avatar-stack" aria-hidden="true" style={{ '--size': `${size}px` }}>
      {shown.map((p, i) => (
        <Avatar key={p.id ?? i} url={p.avatar} size={size} className="avatar-stack__one" />
      ))}
      {more > 0 && <span className="avatar-stack__more">+{more}</span>}
    </span>
  )
}
