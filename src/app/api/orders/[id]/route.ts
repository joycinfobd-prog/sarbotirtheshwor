import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderEvents, orders } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ORDER_STATUS_KEYS } from "@/lib/site";
import { assertSameOrigin, clampNullable, clampStr, safeId } from "@/lib/security";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ ok: false, error: "অননুমোদিত রিকোয়েস্ট।" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  const { id } = await params;
  const orderId = safeId(id);
  if (!orderId) return NextResponse.json({ ok: false, error: "সঠিক অর্ডার নয়।" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) {
    const st = clampStr(body.status, 30);
    if (!ORDER_STATUS_KEYS.includes(st)) return NextResponse.json({ ok: false, error: "সঠিক স্ট্যাটাস নয়।" }, { status: 400 });
    patch.status = st;
  }
  if (body.location !== undefined) patch.location = clampNullable(body.location, 300);
  if (body.note !== undefined) patch.note = clampNullable(body.note, 1000);
  try {
    const [updated] = await db.update(orders).set(patch as any).where(eq(orders.id, orderId)).returning();
    if (!updated) return NextResponse.json({ ok: false, error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
    if (body.status || body.location) {
      await db.insert(orderEvents).values({ orderId, status: (updated as any).status, location: (updated as any).location, note: clampStr(body.eventNote ?? `স্ট্যাটাস আপডেট: ${(updated as any).status}`, 500) });
    }
    return NextResponse.json({ ok: true, order: updated });
  } catch {
    return NextResponse.json({ ok: false, error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
  }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ ok: false, error: "অননুমোদিত রিকোয়েস্ট।" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  const { id } = await params;
  const orderId = safeId(id);
  if (!orderId) return NextResponse.json({ ok: false, error: "সঠিক অর্ডার নয়।" }, { status: 400 });
  try {
    await db.delete(orderEvents).where(eq(orderEvents.orderId, orderId));
    await db.delete(orders).where(eq(orders.id, orderId));
  } catch { /* offline */ }
  return NextResponse.json({ ok: true });
}
