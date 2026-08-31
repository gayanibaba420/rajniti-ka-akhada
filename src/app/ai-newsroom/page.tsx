"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Flame, Search, RefreshCw, Share2, 
  ExternalLink, FilePenLine, CheckCircle2, ArrowRight
} from "lucide-react";
import type { ViralNewsItem } from "@/components/live-viral-radar";

export default function AiNewsroomPage() {
  const [allNews, setAllNews] = useState<ViralNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toast, setToast] = useState<string>("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function fetchNews(force = false) {
    try {
      setLoading(true);
      const url = force 
        ? "https://rajniti-ai-newsroom.vercel.app/api/news?refresh=true" 
        : "https://rajniti-ai-newsroom.vercel.app/api/news";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllNews(data);
        if (force) showToast("✅ ताज़ा खबरें सफलतापूर्वक अपडेट हुईं!");
      }
    } catch {
      showToast("❌ खबरें लोड करने में समस्या आई");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
  }, []);

  const filteredNews = useMemo(() => {
    let list = allNews;
    if (category !== "all") {
      list = list.filter(item => 
        item.category.toLowerCase() === category.toLowerCase() ||
        item.categoryHindi.toLowerCase() === category.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.categoryHindi.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allNews, category, searchQuery]);

  function copyArticle(item: ViralNewsItem) {
    const text = `${item.title}\n\n📍 श्रेणी: ${item.categoryHindi || item.category}\n📰 स्रोत: ${item.source}\n🔗 मूल लिंक: ${item.link}\n\nराजनीति का अखाड़ा (www.rajnitikaakhada.com)`;
    navigator.clipboard.writeText(text);
    showToast("📋 खबर क्लिपबोर्ड में कॉपी हो गई!");
  }

  return (
    <div className="container-main py-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-5 top-5 z-[100] flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-3 text-sm font-bold text-white shadow-2xl animate-bounce">
          <CheckCircle2 size={18} className="text-green-400" />
          {toast}
        </div>
      )}

      {/* Hero Header */}
      <div className="surface relative overflow-hidden rounded-3xl p-6 sm:p-10 border shadow-sm" style={{ borderColor: "var(--line)" }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/10 px-3 py-1 text-xs font-black text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                🔴 LIVE RADAR
              </span>
              <span className="rounded-full bg-[#e8a526]/15 px-3 py-1 text-xs font-black text-[#a66e09] dark:text-[#f8bd4f]">
                ✨ AI POWERED
              </span>
            </div>
            <h1 className="text-3xl font-black sm:text-4xl">
              AI न्यूज़ रूम <span className="brand">& वायरल रडार</span>
            </h1>
            <p className="muted mt-2 max-w-2xl text-sm sm:text-base">
              हिसार, हरियाणा और देश भर की ताज़ा ट्रेंडिंग और ब्रेकिंग खबरों का लाइव AI विश्लेषण। एक क्लिक में पढ़ें, शेयर करें या CMS में ड्राफ्ट करें।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => fetchNews(true)} 
              className="btn btn-ghost flex items-center gap-2 text-sm font-bold border"
              style={{ borderColor: "var(--line)" }}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              ताज़ा करें
            </button>

            <Link href="/admin" className="btn btn-primary flex items-center gap-2 text-sm font-bold">
              <FilePenLine size={16} />
              एडमिन CMS
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="खबर, नेता, पार्टी या शहर खोजें (जैसे: हिसार, हुड्डा, चुनाव, क्राइम)..."
              className="input !pl-12 !py-3.5 text-sm sm:text-base w-full shadow-inner"
            />
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "⚡ सभी खबरें" },
              { id: "hisar", label: "📍 हिसार" },
              { id: "haryana", label: "🌾 हरियाणा" },
              { id: "politics", label: "🏛️ राजनीति" },
              { id: "india", label: "🇮🇳 देश" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition ${
                  category === tab.id
                    ? "bg-[var(--brand)] text-white shadow-md"
                    : "surface border hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={{ borderColor: category === tab.id ? "transparent" : "var(--line)" }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News Stream Feed */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Flame className="text-red-600" />
            लाइव स्ट्रीम ({filteredNews.length} खबरें)
          </h2>
          <span className="text-xs text-neutral-500 font-bold">स्कोर 80+ = उच्च वायरल</span>
        </div>

        {loading && allNews.length === 0 ? (
          <div className="surface rounded-2xl py-16 text-center border" style={{ borderColor: "var(--line)" }}>
            <div className="text-4xl animate-bounce">📡</div>
            <p className="mt-3 font-bold">AI न्यूज़ रूम रडार स्कैन कर रहा है...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="surface rounded-2xl py-16 text-center border" style={{ borderColor: "var(--line)" }}>
            <p className="text-neutral-500">कोई खबर नहीं मिली। कृपया अन्य कीवर्ड या श्रेणी चुनें।</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredNews.map((item) => {
              const whatsappMsg = encodeURIComponent(`🚨 *${item.title}*\n📍 ${item.categoryHindi || item.category} • ${item.source}\n🔗 ${item.link}\n\n📲 राजनीति का अखाड़ा (www.rajnitikaakhada.com)`);
              const isHighViral = item.score >= 85;

              return (
                <div 
                  key={item.id}
                  className="surface group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl p-5 border transition hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                        {item.categoryHindi || item.category}
                      </span>
                      <span className="font-bold text-neutral-500">📰 {item.source}</span>
                      <span className="text-neutral-400">• ⏰ {item.timeAgoHindi}</span>
                    </div>

                    <h3 className="mt-2 text-base sm:text-lg font-bold leading-snug text-neutral-900 dark:text-neutral-100">
                      {item.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-ghost !py-1.5 !px-3 text-xs font-bold flex items-center gap-1 border"
                        style={{ borderColor: "var(--line)" }}
                      >
                        मूल खबर पढ़ें <ExternalLink size={12} />
                      </a>

                      <a 
                        href={`https://api.whatsapp.com/send?text=${whatsappMsg}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn !bg-emerald-600 !text-white !py-1.5 !px-3 text-xs font-bold flex items-center gap-1 hover:!bg-emerald-700"
                      >
                        <Share2 size={12} /> WhatsApp
                      </a>

                      <button
                        onClick={() => copyArticle(item)}
                        className="btn btn-ghost !py-1.5 !px-3 text-xs font-bold flex items-center gap-1 border"
                        style={{ borderColor: "var(--line)" }}
                      >
                        📋 कॉपी करें
                      </button>

                      <Link
                        href="/admin"
                        className="btn !bg-[#e8a526] !text-[#0f172a] !py-1.5 !px-3 text-xs font-black flex items-center gap-1 hover:!bg-[#d97706]"
                      >
                        ✍️ CMS में पोस्ट करें <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>

                  <div className={`flex sm:flex-col items-center justify-center rounded-2xl p-3 text-center min-w-[75px] shrink-0 border ${
                    isHighViral 
                      ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:border-red-900" 
                      : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900"
                  }`}>
                    <span className="text-2xl font-black leading-none">{item.score}</span>
                    <span className="text-[10px] font-black uppercase mt-1">
                      {isHighViral ? "🔥 वायरल" : "ट्रेंडिंग"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
