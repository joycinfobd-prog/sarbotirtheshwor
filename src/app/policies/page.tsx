import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-12 sm:py-16">
      <div className="space-y-10">
        <section className="rounded-2xl border border-paper-deep bg-white p-6 sm:p-8">
          <h1 className="font-display text-3xl font-bold text-navy">{s.terms_title || "শর্তাবলি"}</h1>
          <div className="gold-rule mt-3 w-28" />
          <div className="mt-5 whitespace-pre-line text-sm leading-7 text-ink-soft sm:text-base">
            {s.terms_text}
          </div>
        </section>

        <section className="rounded-2xl border border-paper-deep bg-white p-6 sm:p-8">
          <h2 className="font-display text-3xl font-bold text-navy">{s.privacy_title || "গোপনীয়তা নীতি"}</h2>
          <div className="gold-rule mt-3 w-28" />
          <div className="mt-5 whitespace-pre-line text-sm leading-7 text-ink-soft sm:text-base">
            {s.privacy_text}
          </div>
        </section>
      </div>
    </div>
  );
}
