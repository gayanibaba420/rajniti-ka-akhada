"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim();
    if (!clean) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "सदस्यता सफल!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "कुछ गलत हो गया, पुनः प्रयास करें।");
      }
    } catch {
      setStatus("error");
      setMessage("कनेक्शन त्रुटि — बाद में पुनः प्रयास करें।");
    }
  }

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900/50 p-5">
      <div className="flex items-center gap-2">
        <Mail className="text-[#e8a526]" size={20} />
        <h3 className="font-bold text-[#e8a526]">दैनिक समाचार पाएं</h3>
      </div>
      <p className="mt-2 text-sm text-neutral-400">हर सुबह हिसार और हरियाणा की बड़ी खबरें अपने ईमेल में।</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input flex-1 !border-neutral-600 !bg-neutral-800 !text-white"
          placeholder="आपका ईमेल"
          required
          disabled={status === "loading"}
          aria-label="न्यूज़लेटर ईमेल"
        />
        <button type="submit" disabled={status === "loading"} className="btn btn-primary whitespace-nowrap">
          {status === "loading" ? "..." : "सदस्यता लें"}
        </button>
      </form>
      {message && (
        <p className={`mt-2 text-sm ${status === "success" ? "text-green-400" : "text-red-400"}`} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
