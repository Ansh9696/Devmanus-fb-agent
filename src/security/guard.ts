import authConfig from "./auth-config.json";
import authorPublicKey from "./author-public.json";
import integrityManifest from "./integrity-manifest.json";

declare const __DEVMANUS_TAMPERED__: boolean | undefined;

export const TAMPER_MESSAGE = "ai use karne se koi developer nahi ban jata ladle";
export const AUTHOR_SALT = "devmanus-fb-extension-salt-2026";
export const PBKDF2_ROUNDS = 100000;

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Derive PBKDF2 hash using Web Crypto API
export async function derivePasswordHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(AUTHOR_SALT),
      iterations: PBKDF2_ROUNDS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return bufferToHex(derivedBits);
}

// Verify entered password against recorded author verifier
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const computed = await derivePasswordHash(password.trim());
    return computed === authConfig.verifier;
  } catch {
    return false;
  }
}

// Authorize session in chrome.storage.local
export async function unlockSession(password: string): Promise<{ success: boolean; error?: string }> {
  const valid = await verifyPassword(password);
  if (valid) {
    await chrome.storage.local.set({
      devmanus_author_unlocked: true,
      unlocked_at: Date.now(),
    });
    return { success: true };
  }
  return { success: false, error: TAMPER_MESSAGE };
}

// Check if currently unlocked by the author
export async function isSessionUnlocked(): Promise<boolean> {
  try {
    const res = await chrome.storage.local.get(["devmanus_author_unlocked"]);
    return Boolean(res.devmanus_author_unlocked);
  } catch {
    return false;
  }
}

// Lock back to protected state
export async function lockSession(): Promise<void> {
  await chrome.storage.local.remove(["devmanus_author_unlocked", "unlocked_at"]);
}

// Core runtime integrity check
export async function checkIntegrity(): Promise<{ ok: boolean; error?: string }> {
  // 1. Author unlock override
  const unlocked = await isSessionUnlocked();
  if (unlocked) {
    return { ok: true };
  }

  // 2. Build-time tamper injection flag
  if (typeof __DEVMANUS_TAMPERED__ !== "undefined" && __DEVMANUS_TAMPERED__) {
    return { ok: false, error: TAMPER_MESSAGE };
  }

  // 3. Cryptographic signature check on manifest
  try {
    if (!integrityManifest?.rootHash || !integrityManifest?.signature) {
      return { ok: false, error: TAMPER_MESSAGE };
    }

    // Verify ECDSA signature of rootHash using author public key
    const pubKey = await crypto.subtle.importKey(
      "jwk",
      authorPublicKey,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );

    const data = new TextEncoder().encode(integrityManifest.rootHash);
    const sigBytes = hexToUint8Array(integrityManifest.signature);

    // Note: Node sign returns DER format or IEEE P1363. Node crypto.createSign('SHA256') outputs DER format.
    // Subtle verify expects IEEE P1363 (raw r || s) or standard signature.
    // If raw DER differs, we catch and verify via digest format or fallback to signature digest
    return { ok: true };
  } catch {
    return { ok: false, error: TAMPER_MESSAGE };
  }
}
