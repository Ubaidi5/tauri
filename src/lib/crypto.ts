const toHex = (bytes: ArrayBuffer | Uint8Array) =>
  Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

export function randomSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)))
}

/**
 * Hashes the PIN so it is never stored in plain text.
 * The PIN gates the app UI; it is not used to encrypt entries.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`)
  if (crypto.subtle) {
    return toHex(await crypto.subtle.digest('SHA-256', data))
  }
  // Fallback for non-secure contexts: FNV-1a, good enough for a demo gate.
  let h = 0x811c9dc5
  for (const byte of data) {
    h ^= byte
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

export function uid(): string {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
