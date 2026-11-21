// The avatars users can pick in Edit Profile (Figma 13–14). Stored in users.avatar_url as "preset:<key>";
// the database only accepts presets and gives everyone "preset:hello" to start (migration 22).
export const AVATARS = [
  { key: 'hello', label: 'Hello' },
  { key: 'mug', label: 'Mug' },
  { key: 'cookie', label: 'Cookie' },
  { key: 'orange', label: 'Orange' },
  { key: 'walk', label: 'Walk' },
  { key: 'pancakes', label: 'Pancakes' },
  { key: 'boba', label: 'Boba' },
].map((a) => ({ ...a, src: `/avatars/${a.key}.png`, value: `preset:${a.key}` }))

const DEFAULT = AVATARS[0]

// Only our own pictures: anything that isn't a known preset shows the starting anteater.
export function avatarSrc(avatarUrl) {
  return (AVATARS.find((a) => a.value === avatarUrl) ?? DEFAULT).src
}
