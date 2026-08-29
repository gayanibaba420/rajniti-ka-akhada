"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "लॉगिन विफल");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("सर्वर से कनेक्ट नहीं हो सका");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--background)] p-4">
      <form onSubmit={submit} className="surface w-full max-w-md rounded-2xl p-8">
        <h1 className="text-2xl font-black">राजनीति का <span className="brand">अखाड़ा</span></h1>
        <p className="muted mt-2 text-sm">संपादकीय CMS में लॉगिन करें</p>
        {error && <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
        <label className="mt-6 block text-sm font-bold">ईमेल<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-2" autoComplete="username" /></label>
        <label className="mt-4 block text-sm font-bold">पासवर्ड<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-2" autoComplete="current-password" /></label>
        <button disabled={loading} className="btn btn-primary mt-6 w-full">{loading ? "लॉगिन..." : "लॉगिन"}</button>
      </form>
    </div>
  );
}
