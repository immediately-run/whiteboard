// Object id generation. Ids are the filename stem of `objects/<id>.mdx` and must
// match [a-z0-9][a-z0-9-_]* (spec §1). Creation collisions are avoided by a
// 4-char random base32 suffix (`<slug>-<rand>`, §5.3) so two collaborators
// creating objects at once never land on the same file.

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

export function generateId(slug: string): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `${slug}-${s}`;
}
