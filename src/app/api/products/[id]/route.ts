import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { toProductValues, validateProductValues } from "../route";
import { assertSameOrigin, safeId } from "@/lib/security";
import { updateProduct, deleteProduct, listCategories } from "@/lib/store";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ ok: false, error: "অননুমোদিত রিকোয়েস্ট।" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  const { id } = await params;
  const pid = safeId(id);
  if (!pid) return NextResponse.json({ ok: false, error: "সঠিক পণ্য নয়।" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  if (body.isLive !== undefined && Object.keys(body).length === 1) {
    await updateProduct(pid, { isLive: Boolean(body.isLive) });
    return NextResponse.json({ ok: true });
  }
  const values = toProductValues(body);
  const err = validateProductValues(values);
  if (err) return NextResponse.json({ ok: false, error: err }, { status: 400 });
  if (values.categoryId) {
    const cats = await listCategories(true);
    if (!cats.find((c) => c.id === values.categoryId)) return NextResponse.json({ ok: false, error: "ক্যাটাগরি পাওয়া যায়নি।" }, { status: 400 });
  }
  await updateProduct(pid, values as any);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!assertSameOrigin(req)) return NextResponse.json({ ok: false, error: "অননুমোদিত রিকোয়েস্ট।" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  const { id } = await params;
  const pid = safeId(id);
  if (!pid) return NextResponse.json({ ok: false, error: "সঠিক পণ্য নয়।" }, { status: 400 });
  await deleteProduct(pid);
  return NextResponse.json({ ok: true });
}
