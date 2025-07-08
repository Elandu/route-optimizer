export async function encrypt(text: string, key: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const pwKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derivedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    enc
  );
  const buf = new Uint8Array(salt.byteLength + iv.byteLength + cipher.byteLength);
  buf.set(salt);
  buf.set(iv, salt.byteLength);
  buf.set(new Uint8Array(cipher), salt.byteLength + iv.byteLength);
  return btoa(String.fromCharCode(...buf));
}

export async function decrypt(data: string, key: string): Promise<string> {
  const buf = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  const salt = buf.slice(0, 16);
  const iv = buf.slice(16, 28);
  const cipher = buf.slice(28);
  const pwKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const derivedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    cipher
  );
  return new TextDecoder().decode(plain);
}
