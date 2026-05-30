// PBKDF2-based PIN hashing with a random salt.
// Format: "<hex-salt>:<hex-derived-key>"
// Legacy format (no colon): plain SHA-256 with no salt — supported for migration only.

async function pbkdf2Hash(pin, saltHex) {
  const enc = new TextEncoder()
  const saltBytes = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)))
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: 50000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Hash a PIN using PBKDF2 + random salt. Returns "salt:hash".
export async function hashPin(pin) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const hash = await pbkdf2Hash(pin, salt)
  return `${salt}:${hash}`
}

// Verify a PIN against a stored hash. Handles both legacy (plain SHA-256)
// and current (PBKDF2 with salt) formats. Returns { valid, legacy }.
export async function verifyPin(pin, storedHash) {
  if (!storedHash) return { valid: false, legacy: false }

  // Legacy format: no colon separator — plain unsalted SHA-256
  if (!storedHash.includes(':')) {
    const enc = new TextEncoder()
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(pin))
    const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
    return { valid: hash === storedHash, legacy: true }
  }

  const [salt] = storedHash.split(':')
  const computed = await pbkdf2Hash(pin, salt)
  return { valid: `${salt}:${computed}` === storedHash, legacy: false }
}
