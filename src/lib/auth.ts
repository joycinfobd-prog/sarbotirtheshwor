import { createHmac, randomBytes, createHash, scryptSync } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Stateless, env-safe admin auth.
 * - Owner account is baked into code (hashed) so login NEVER needs a database.
 * - Session = HMAC-signed token in an HTTP-only cookie (no server store).
 * - The signing key is deterministic per deployment so route handlers and
 *   layouts always agree. For extra safety set AUTH_SECRET in
 *   Vercel → Project → Settings → Environment Variables.
 *
 * SECURITY NOTE: to change the owner password, edit OWNER_PASSWORD below,
 * then change your password again from the admin panel.
 */

export const SESSION_COOKIE = "rudra_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const SECRET =
  process.env.AUTH_SECRET ||
  createHash("sha256")
    .update("rudra-admin-fallback-" + (process.env.DATABASE_URL || "no-db") + "-v1")
    .digest("hex");

function hmac(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* -------------------- password hashing -------------------- */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${hashWithSalt(password, salt)}`;
}

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
  return timingSafeEqualStr(hashWithSalt(password, salt), hash);
}

/* -------------------- session token -------------------- */
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
    if (!timingSafeEqualStr(sig, hmac(`${userId}.${exp}`))) return null;
    const expMs = Number(exp);
    const uid = Number(userId);
    if (!Number.isFinite(expMs) || expMs < Date.now()) return null;
    if (!Number.isFinite(uid) || uid <= 0) return null;
    return Math.floor(uid);
  } catch {
    return null;
  }
}

/* -------------------- built-in admin accounts -------------------- */
export type AdminAccount = { id: number; name: string; phone: string; role: string };

const OWNER_PASSWORD = "admin123";

export const OWNER: AdminAccount = {
  id: 1,
  name: "সুপার অ্যাডমিন",
  phone: "01794608874",
  role: "owner",
};

const OWNER_HASH = hashPassword(OWNER_PASSWORD);

export function findAdminByPhone(
  phone: string,
): (AdminAccount & { passwordHash: string; isActive: boolean }) | null {
  if (phone.replace(/\D/g, "") === OWNER.phone) {
    return { ...OWNER, passwordHash: OWNER_HASH, isActive: true };
  }
  return null;
}

export function getAdminById(id: number): AdminAccount | null {
  return id === OWNER.id ? OWNER : null;
}

/* -------------------- session user -------------------- */
export type SessionUser = { id: number; name: string; phone: string; role: string };

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const userId = verifySessionToken(store.get(SESSION_COOKIE)?.value);
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
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
