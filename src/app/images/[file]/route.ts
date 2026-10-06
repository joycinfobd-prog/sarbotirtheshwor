import { NextResponse } from "next/server";
import { getProductArt } from "@/lib/product-art";

// Built-in artwork for /images/<name>.jpg when no real file exists in
// public/images. A real public/images/<name>.jpg always takes priority.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const svg = getProductArt(file);
  if (!svg) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
