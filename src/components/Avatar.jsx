import { avatarSrc } from '../lib/avatars'

export default function Avatar({ url, size = 40, className = '' }) {
  return <img className={`avatar ${className}`} src={avatarSrc(url)} alt="" width={size} height={size} />
}
