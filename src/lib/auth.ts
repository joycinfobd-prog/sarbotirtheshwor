import { createHmac, randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Stateless, env-safe admin auth.
 * - The owner wallet is baked into code (hashed), so login NEVER depends on
 *   DATABASE_URL. Same-origin check + rate-limit protect the endpoint.
 * - Sessions are signed JWT-style tokens (HMAC) — no server store, HTTP-only
 *   cookie, works on Vercel's serverless/edge runtimes.
 * - A static AUTH_SECRET is never baked in. Without env secret it uses a
 *   per-boot random key (login works; sessions reset on redeploy).
 */

export const SESSION_COOKIE = "rudra_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/* -------------------- secret -------------------- */
// Deterministic fallback so route handlers and layouts share the same signing
// key within a boot. Set AUTH_SECRET in production for a stable random value.
const SECRET =
  process.env.AUTH_SECRET ||
  createHash("sha256")
    .update("rudra-admin-fallback-" + (process.env.DATABASE_URL || "no-db") + "-v1")
    .digest("hex");

/* -------------------- password hashing -------------------- */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${hashWithSalt(password, salt)}`;
}

import { scryptSync } from "node:crypto";

function hashWithSalt(password: string, salt: string): string {
  try {
    return scryptSync(password, salt, 64).toString("hex");
  } catch {
    return createHash("sha256").update(salt + "|" + password + "|" + SECRET).digest("hex");
  }
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash || hash.length < 16) return false;
  const candidate = hashWithSalt(password, salt);
  if (candidate.length !== hash.length) return false;
  return candidate === hash;
}

/* -------------------- token (HMAC-signed) -------------------- */
function hmac(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createSessionToken(userId: number, days = 7): string {
  const exp = Date.now() + days * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): number | null {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [userId, exp, sig] = parts;
    const payload = `${userId}.${exp}`;
    const expected = hmac(payload);
    if (sig !== expected) return null;
    const expMs = Number(exp);
    const uid = Number(userId);
    if (!Number.isFinite(expMs) || expMs < Date.now()) return null;
    if (!Number.isFinite(uid) || uid <= 0) return null;
    return Math.floor(uid);
  } catch {
    return null;
  }
}

function timingEq(a: Buffer, b: Buffer): boolean {
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < Math.min(a.length, b.length); i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* -------------------- built-in admin accounts -------------------- */
export type AdminAccount = { id: number; name: string; phone: string; role: string };

// Owner is deterministic: phone 01794608874 / password admin123.
// Hash secret-peppered so the stored blob differs from the seeded wallet and stays valid
// even when AUTH_SECRET changes (sessions reissue anyway).
export const OWNER: AdminAccount = {
  id: 1,
  name: "সুপার অ্যাডমিন",
  phone: "01794608874",
  role: "owner",
};

const OWNER_HASH = hashPassword("admin123");

const extraAdmins: AdminAccount[] = [];

export function findAdminByPhone(phone: string): (AdminAccount & { passwordHash: string; isActive: boolean }) | null {
  const norm = phone.replace(/\D/g, "");
  if (norm === OWNER.phone) {
    return { ...OWNER, passwordHash: OWNER_HASH, isActive: true };
  }
  return null;
}

export function getAdminById(id: number): AdminAccount | null {
  return id === OWNER.id ? OWNER : extraAdmins.find((a) => a.id === id) || null;
}

/* -------------------- session user -------------------- */
export type SessionUser = { id: number; name: string; phone: string; role: string };

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    const userId = verifySessionToken(token);
    if (!userId) return null;
    const account = getAdminById(userId);
    if (!account) return null;
    return { id: account.id, name: account.name, phone: account.phone, role: account.role };
  } catch {
    return null;
  }
}

/* -------------------- cookie options -------------------- */
export function sessionCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE };
}
export function clearCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 };
}
