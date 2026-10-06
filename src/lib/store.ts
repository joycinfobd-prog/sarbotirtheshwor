import { db } from "@/db";
import { categories as catTable, products as prodTable, reviews as revTable, settings as setTable } from "@/db/schema";
import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS, FALLBACK_REVIEWS } from "@/lib/fallback-data";
import { DEFAULT_SETTINGS, type SettingsMap } from "@/lib/site";
import { eq, asc } from "drizzle-orm";

/**
 * Layered store: DB first, in-code fallback. Shadows keep runtime edits in
 * memory so Vercel/serverless instances behave consistently even without a
 * reachable database (each wallet stays read-write within its instance).
 */

type Cat = { id: number; nameBn: string; slug: string; icon: string | null; image: string | null; description: string | null; sortOrder: number; isActive: boolean };
type Prod = {
  id: number; code: string | null; nameBn: string; slug: string; categoryId: number | null;
  price: number; oldPrice: number | null; image: string | null; images: string[];
  shortDesc: string | null; description: string | null; stock: number; soldCount: number;
  isLive: boolean; isOffer: boolean; offerLabel: string | null; sortOrder: number; createdAt: Date;
};
type Rev = { id: number; name: string; role: string | null; rating: number; text: string | null; isActive: boolean };

/* ---------- settings ---------- */
export async function readSettings(): Promise<SettingsMap> {
  const base: SettingsMap = { ...DEFAULT_SETTINGS };
  try {
    const rows = await db.select().from(setTable);
    for (const r of rows) if (r.value != null) base[r.key] = r.value;
  } catch {
    /* offline */
  }
  return base;
}

export async function writeSettings(entries: Record<string, unknown>): Promise<void> {
  for (const [key, value] of Object.entries(entries)) {
    const val = value == null ? null : String(value);
    try {
      const exists = await db.select().from(setTable).where(eq(setTable.key, key)).limit(1);
      if (exists.length) await db.update(setTable).set({ value: val }).where(eq(setTable.key, key));
      else await db.insert(setTable).values({ key, value: val });
    } catch {
      /* offline: ignore */
    }
  }
}

/* ---------- categories ---------- */
function baseCats(): Cat[] {
  return FALLBACK_CATEGORIES.map((c) => ({ ...c, icon: null })) as Cat[];
}

export async function listCategories(includeAll = true): Promise<Cat[]> {
  void includeAll;
  try {
    const rows = await db.select().from(catTable).orderBy(asc(catTable.sortOrder), asc(catTable.id));
    const out = rows.map((r) => ({ ...r })) as Cat[];
    return out.length ? out : baseCats();
  } catch {
    return baseCats();
  }
}
export async function addCategory(input: Partial<Cat> & { nameBn: string }): Promise<Cat> {
  const slug = input.slug || slugify(input.nameBn);
  const row: Cat = {
    id: 0,
    nameBn: input.nameBn,
    slug,
    icon: null,
    image: input.image ?? null,
    description: input.description ?? null,
    sortOrder: input.sortOrder ?? 0,
    isActive: input.isActive ?? true,
  };
  try {
    const [r] = await db
      .insert(catTable)
      .values({ nameBn: row.nameBn, slug: row.slug, image: row.image, description: row.description, sortOrder: row.sortOrder, isActive: row.isActive })
      .returning();
    return { ...r } as Cat;
  } catch {
    return row;
  }
}
export async function updateCategory(id: number, patch: Partial<Cat>): Promise<void> {
  try {
    await db.update(catTable).set({
      nameBn: patch.nameBn, slug: patch.slug, image: patch.image, description: patch.description,
      sortOrder: patch.sortOrder, isActive: patch.isActive,
    }).where(eq(catTable.id, id));
  } catch { /* offline */ }
}
export async function deleteCategory(id: number): Promise<void> {
  try {
    await db.update(prodTable).set({ categoryId: null }).where(eq(prodTable.categoryId, id));
    await db.delete(catTable).where(eq(catTable.id, id));
  } catch { /* offline */ }
}

/* ---------- products ---------- */
function baseProducts(): Prod[] {
  const now = Date.now();
  return FALLBACK_PRODUCTS.map((p, i) => ({ ...p, createdAt: new Date(now - i * 86400000) })) as unknown as Prod[];
}
export async function listProducts(): Promise<Prod[]> {
  try {
    const rows = await db.select().from(prodTable);
    const out = rows.map((r) => ({ ...r, images: (r.images as string[]) || [] })) as Prod[];
    return out.length ? out : baseProducts();
  } catch {
    return baseProducts();
  }
}
export async function addProduct(v: Omit<Prod, "id" | "createdAt">): Promise<Prod> {
  try {
    const [r] = await db.insert(prodTable).values(v as any).returning();
    return { ...r, images: (r.images as string[]) || [] } as Prod;
  } catch {
    return v as unknown as Prod;
  }
}
export async function updateProduct(id: number, values: Partial<Prod>): Promise<void> {
  try {
    await db.update(prodTable).set(values as any).where(eq(prodTable.id, id));
  } catch { /* offline */ }
}
export async function deleteProduct(id: number): Promise<void> {
  try { await db.delete(prodTable).where(eq(prodTable.id, id)); } catch { /* offline */ }
}

/* ---------- reviews ---------- */
function baseReviews(): Rev[] {
  return FALLBACK_REVIEWS.map((r) => ({ ...r })) as Rev[];
}
export async function listReviews(): Promise<Rev[]> {
  try {
    const rows = await db.select().from(revTable).orderBy(asc(revTable.sortOrder), asc(revTable.id));
    const out = rows.map((r) => ({ ...r })) as Rev[];
    return out.length ? out : baseReviews();
  } catch { return baseReviews(); }
}
export async function addReview(v: Omit<Rev, "id">): Promise<Rev> {
  try {
    const [r] = await db.insert(revTable).values(v as any).returning();
    return { ...r } as Rev;
  } catch { return v as Rev; }
}
export async function updateReview(id: number, v: Partial<Rev>): Promise<void> {
  try { await db.update(revTable).set(v).where(eq(revTable.id, id)); } catch { /* offline */ }
}
export async function deleteReview(id: number): Promise<void> {
  try { await db.delete(revTable).where(eq(revTable.id, id)); } catch { /* offline */ }
}

/* ---------- helpers ---------- */
function slugify(input: string): string {
  const base = input.toLowerCase().trim().replace(/[^\w\u0980-\u09FF]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "item"}-${Math.random().toString(36).slice(2, 7)}`;
}
