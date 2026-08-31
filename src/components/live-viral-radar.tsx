"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, RefreshCw, ExternalLink, ArrowRight } from "lucide-react";

export type ViralNewsItem = {
  id: string;
  title: string;
  source: string;
  category: string;
  categoryHindi: string;
  score: number;
  timeAgoHindi: string;
  link: string;
};

export function LiveViralRadarWidget({ limit = 5 }: { limit?: number }) {
  const [items, setItems] = useState<ViralNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchRadar(force = false) {
    try {
      setLoading(true);
      setError(false);
      const url = `https://rajniti-ai-newsroom.vercel.app/api/news?limit=${limit}${force ? "&refresh=true" : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data.slice(0, limit));
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRadar();
  }, [limit]);

  return (
    <div className="surface overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: "var(--line)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
          </span>
          <h3 className="flex items-center gap-1.5 text-base font-black text-neutral-900 dark:text-neutral-100">
            <Flame size={18} className="text-red-600" />
            AI वायरल रडार
          </h3>
        </div>
        <button
          onClick={() => fetchRadar(true)}
          className="btn btn-ghost !p-1.5 text-xs text-neutral-500 hover:text-neutral-900"
          title="ताज़ा करें"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Body */}
      <div className="divide-y" style={{ borderColor: "var(--line)" }}>
        {loading && items.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            <div className="inline-block animate-spin text-lg">📡</div>
            <p className="mt-1 font-bold">ट्रेंडिंग खबरें स्कैन हो रही हैं...</p>
          </div>
        ) : error && items.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400">
            रडार अपडेट हो रहा है...
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="group p-3.5 transition hover:bg-black/5 dark:hover:bg-white/5">
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-neutral-500">
                <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-red-600 dark:text-red-400">
                  {item.categoryHindi || item.category}
                </span>
                <span className="flex items-center gap-1">
                  🔥 <strong className="text-red-600">{item.score}</strong>
                </span>
              </div>

              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 block text-xs font-bold leading-snug text-neutral-800 hover:text-[var(--brand)] dark:text-neutral-200"
              >
                {item.title}
              </a>

              <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-400">
                <span>📰 {item.source}</span>
                <span>⏰ {item.timeAgoHindi}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Link */}
      <div className="border-t p-2.5 text-center bg-black/5 dark:bg-white/5" style={{ borderColor: "var(--line)" }}>
        <Link
          href="/ai-newsroom"
          className="inline-flex items-center gap-1 text-xs font-black text-[var(--brand)] hover:underline"
        >
          पूरा AI न्यूज़ रूम देखें <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
