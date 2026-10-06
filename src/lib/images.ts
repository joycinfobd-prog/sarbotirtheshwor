// Keep a minimal helper so existing imports still work, but do not alter the
// visual design anymore. If a real image path exists, it is used as-is.
export function withImageFallback(src?: string | null): string | undefined {
  return src || undefined;
}
