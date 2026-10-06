import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  assertSameOrigin, clampNullable, clampStr, isSafeImageUrl, isValidSlug, safeInt,
} from "@/lib/security";
import { listCategories, addCategory } from "@/lib/store";

export async function GET() {
  const user = await getSessionUser();
  const cats = await listCategories(user != null);
  return NextResponse.json({ ok: true, categories: cats });
}

export async function POST(req: NextRequest) {
  if (!assertSameOrigin(req)) return NextResponse.json({ ok: false, error: "অননুমোদিত রিকোয়েস্ট।" }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "অনুমতি নেই" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const nameBn = clampStr(body.nameBn, 140);
  if (!nameBn) return NextResponse.json({ ok: false, error: "ক্যাটাগরির নাম দিন।" }, { status: 400 });
  let slug = body.slug ? clampStr(body.slug, 140) : "";
  if (slug && !isValidSlug(slug)) return NextResponse.json({ ok: false, error: "স্লাগে শুধু অক্ষর, সংখ্যা, - ও _ ব্যবহার করুন।" }, { status: 400 });
  const image = clampNullable(body.image, 2000);
  if (image && !isSafeImageUrl(image)) return NextResponse.json({ ok: false, error: "ছবির লিংক সঠিক নয়।" }, { status: 400 });
  const row = await addCategory({
    nameBn, slug: slug || undefined, image, description: clampNullable(body.description, 2000),
    sortOrder: safeInt(body.sortOrder, 0, 0, 1_000_000), isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  });
  return NextResponse.json({ ok: true, category: row });
}
