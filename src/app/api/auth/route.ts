import { NextRequest, NextResponse } from "next/server";
import {
  clearCookieOptions,
  createSessionToken,
  findAdminByPhone,
  getSessionUser,
  sessionCookieOptions,
  verifyPassword,
  SESSION_COOKIE,
} from "@/lib/auth";
import {
  assertSameOrigin,
  checkRateLimit,
  clampStr,
  clientIp,
  sleep,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    if (!assertSameOrigin(req)) {
      return NextResponse.json({ ok: false, error: "অননুমোদিত রিকোয়েস্ট।" }, { status: 403 });
    }
    const ip = clientIp(req);
    const body = await req.json().catch(() => ({}));
    const phone = clampStr(body.phone, 30);
    const password = String(body.password ?? "").slice(0, 128);

    const byIp = checkRateLimit(`login:ip:${ip}`, 30, 60_000);
    const byPhone = checkRateLimit(`login:phone:${ip}:${phone}`, 8, 60_000);
    const rl = byIp.allowed ? byPhone : byIp;
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "অনেকবার ভুল চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }

    if (!phone || !password) {
      return NextResponse.json({ ok: false, error: "মোবাইল নম্বর ও পাসওয়ার্ড দিন।" }, { status: 400 });
    }

    const account = findAdminByPhone(phone);
    if (!account || !account.isActive || !verifyPassword(password, account.passwordHash)) {
      await sleep(400);
      return NextResponse.json({ ok: false, error: "ভুল মোবাইল নম্বর বা পাসওয়ার্ড।" }, { status: 401 });
    }

    const res = NextResponse.json({
      ok: true,
      user: { id: account.id, name: account.name, role: account.role },
    });
    res.cookies.set(SESSION_COOKIE, createSessionToken(account.id), sessionCookieOptions());
    return res;
  } catch (error) {
    console.error("[auth] login failed", error);
    return NextResponse.json(
      { ok: false, error: "লগইন সার্ভিস এখন কাজ করছে না।" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ ok: true, user: null });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", clearCookieOptions());
  return res;
}
