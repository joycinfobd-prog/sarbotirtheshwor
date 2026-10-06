import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { DEFAULT_SETTINGS, SETTINGS_FIELDS } from "@/lib/site";
import { assertSameOrigin, clampStr, isSafeImageUrl } from "@/lib/security";
import { writeSettings } from "@/lib/store";

const ALLOWED_KEYS = new Set([
  ...SETTINGS_FIELDS.map((f) => f.key),
  ...Object.keys(DEFAULT_SETTINGS),
]);
const IMAGE_KEYS = new Set(SETTINGS_FIELDS.filter((f) => f.type === "image").map((f) => f.key));

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  try {
    const rows = await db.select().from(settings);
    return NextResponse.json({ ok: true, settings: rows });
  } catch {
    const merged = Object.entries({ ...DEFAULT_SETTINGS });
    return NextResponse.json({ ok: true, settings: merged.map(([key, value]) => ({ key, value })) });
  }
}

export async function PATCH(req: NextRequest) {
  if (!assertSameOrigin(req)) return NextResponse.json({ ok: false, error: "অননুমোদিত রিকোয়েস্ট।" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const entries = Object.entries(body as Record<string, unknown>).slice(0, 60);
  for (const [key, value] of entries) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (value != null && IMAGE_KEYS.has(key)) {
      const url = clampStr(value, 2000);
      if (url && !isSafeImageUrl(url)) return NextResponse.json({ ok: false, error: `“${key}” এর ছবির লিংক সঠিক নয়।` }, { status: 400 });
    }
    if (key === "whatsapp" && value != null) {
      const digits = String(value).replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) return NextResponse.json({ ok: false, error: "সঠিক WhatsApp নম্বর দিন।" }, { status: 400 });
    }
  }
  await writeSettings(Object.fromEntries(entries) as Record<string, unknown>);
  return NextResponse.json({ ok: true });
}
