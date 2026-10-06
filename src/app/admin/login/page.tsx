"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock, Phone } from "lucide-react";
import { LogoMark } from "@/components/Logo";

const FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "0.72rem 0.9rem 0.72rem 2.7rem",
  borderRadius: "0.55rem",
  border: "1px solid #c6dbee",
  background: "#fff",
  fontSize: "0.95rem",
  outline: "none",
};

const ICON_STYLE: React.CSSProperties = {
  position: "absolute",
  left: "0.8rem",
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const raw = await res.text();
      let data: { ok?: boolean; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("সার্ভার থেকে সঠিক response পাওয়া যায়নি।");
      }
      if (!res.ok) throw new Error(data.error || "লগইন করা যায়নি।");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "কিছু ভুল হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-paper-deep bg-white p-8 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <LogoMark className="h-16 w-16" />
            <h1 className="mt-4 font-display text-2xl font-bold text-navy">অ্যাডমিন প্যানেল</h1>
            <p className="mt-1 text-sm text-ink-soft">সর্বতীর্থেশ্বর মহাদেব রুদ্রাক্ষ ভান্ডার</p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4" noValidate={false}>
            <div>
              <label htmlFor="admin-phone" className="mb-1.5 block text-sm font-medium text-navy">
                মোবাইল নম্বর
              </label>
              <div style={{ position: "relative" }}>
                <Phone size={17} className="text-ink-soft" style={ICON_STYLE} strokeWidth={1.8} />
                <input
                  id="admin-phone"
                  style={FIELD_STYLE}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  required
                  autoComplete="username"
                  inputMode="tel"
                  maxLength={15}
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-navy">
                পাসওয়ার্ড
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={17} className="text-ink-soft" style={ICON_STYLE} strokeWidth={1.8} />
                <input
                  id="admin-password"
                  type="password"
                  style={FIELD_STYLE}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  maxLength={128}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert">{error}</div>
            ) : null}

            <button type="submit" disabled={loading} className="btn btn-navy w-full disabled:opacity-60">
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              লগইন করুন
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/" className="text-navy-mid hover:underline">← ওয়েবসাইটে ফিরে যান</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
