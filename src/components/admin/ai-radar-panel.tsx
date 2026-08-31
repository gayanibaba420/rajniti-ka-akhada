"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  Radar,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
  XCircle,
  Flame,
  Search,
  ExternalLink,
  Send,
  FilePenLine,
  Check,
} from "lucide-react";
import { AI_RADAR_STATUS_LABELS, AI_RADAR_VERIFICATION_LABELS, type AiRadarSettings } from "@/lib/ai-radar/types";
import { LoadingBlock, MediaPickerModal, PanelHeader } from "./shared";
import type { MediaItem, Meta, User } from "./types";

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

type AiDraftRow = {
  id: string;
  title: string | null;
  slug: string | null;
  content: string | null;
  summary: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  category: string | null;
  tags: string[];
  imagePrompt: string | null;
  sourceName: string;
  sourceUrl: string;
  sourcePublishedAt: string | null;
  rawTitle: string;
  aiConfidence: number | null;
  verificationStatus: string;
  status: string;
  errorMessage: string | null;
  featuredImage?: { id: string; url: string; alt?: string | null } | null;
  createdAt: string;
};

type AiStats = {
  fetched: number;
  draft: number;
  needsVerification: number;
  approved: number;
  published: number;
  rejected: number;
  total: number;
};

type AiLog = {
  id: string;
  action: string;
  status: string;
  message: string | null;
  createdAt: string;
};

export function AiRadarPanel({
  flash,
  meta,
  currentUser,
  onOpenEditor,
  onRefresh,
}: {
  flash: (s: string) => void;
  meta?: Meta | null;
  currentUser?: User | null;
  onOpenEditor?: (data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    categoryId?: string;
    tags?: string;
    location?: string;
    highlight?: string;
    seoTitle?: string;
    seoDescription?: string;
  }) => void;
  onRefresh?: () => void;
}) {
  const [mainTab, setMainTab] = useState<"live" | "gemini">("live");
  
  // Live Radar Feed States
  const [liveNews, setLiveNews] = useState<ViralNewsItem[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveCategory, setLiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [publishedMap, setPublishedMap] = useState<Record<string, boolean>>({});
  const [publishingId, setPublishingId] = useState<string>("");
  const [livePreviewItem, setLivePreviewItem] = useState<ViralNewsItem | null>(null);

  // Gemini / Database Radar States
  const [geminiTab, setGeminiTab] = useState<"dashboard" | "settings">("dashboard");
  const [drafts, setDrafts] = useState<AiDraftRow[]>([]);
  const [stats, setStats] = useState<AiStats | null>(null);
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [settings, setSettings] = useState<AiRadarSettings | null>(null);
  const [apiKeys, setApiKeys] = useState<{ geminiConfigured: boolean; gnewsConfigured: boolean } | null>(null);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<AiDraftRow | null>(null);
  const [editDraft, setEditDraft] = useState<AiDraftRow | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  // Fetch Live Viral Feed
  async function fetchLiveNews(force = false) {
    try {
      setLiveLoading(true);
      const url = force
        ? "https://rajniti-ai-newsroom.vercel.app/api/news?refresh=true"
        : "https://rajniti-ai-newsroom.vercel.app/api/news";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLiveNews(data);
        if (force) flash("ताज़ा लाइव खबरें अपडेट हुईं");
      }
    } catch {
      flash("लाइव खबरें लोड करने में त्रुटि");
    } finally {
      setLiveLoading(false);
    }
  }

  useEffect(() => {
    fetchLiveNews();
  }, []);

  // Filter Live News
  const filteredLiveNews = useMemo(() => {
    let list = liveNews;
    if (liveCategory !== "all") {
      list = list.filter(
        (item) =>
          item.category.toLowerCase() === liveCategory.toLowerCase() ||
          item.categoryHindi.toLowerCase() === liveCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q) ||
          item.categoryHindi.toLowerCase().includes(q)
      );
    }
    return list;
  }, [liveNews, liveCategory, searchQuery]);

  // Find Best Matching DB Category
  function matchCategory(catSlugOrName: string): string {
    if (!meta?.categories?.length) return "";
    const found = meta.categories.find(
      (c) =>
        c.slug.toLowerCase() === catSlugOrName.toLowerCase() ||
        c.name.toLowerCase() === catSlugOrName.toLowerCase() ||
        catSlugOrName.toLowerCase().includes(c.slug.toLowerCase()) ||
        catSlugOrName.toLowerCase().includes(c.name.toLowerCase())
    );
    return found ? found.id : meta.categories[0].id;
  }

  function cleanNewsHeadline(rawTitle: string): string {
    return rawTitle
      .replace(/\s*\.\.\.\s*$/, "")
      .replace(/\s*-\s*[A-Za-z\u0900-\u097F\s]+$/, "")
      .trim();
  }

  function buildJournalisticArticle(item: ViralNewsItem) {
    const headline = cleanNewsHeadline(item.title);
    const now = new Date();
    const dateStr = new Intl.DateTimeFormat("hi-IN", { day: "numeric", month: "long", year: "numeric" }).format(now);

    const isHisar = /हिसार|hisar/i.test(headline) || /hisar/i.test(item.category || "");
    const isAssembly = /विधानसभा|मानसून सत्र|विपक्ष|हुड्डा|विज|सैनी|विधायक|स्पीकर|सदन/i.test(headline);
    const isCrimeOrPolice = /पुलिस|गुंडागर्दी|क्राइम|मुकदमा|हादसा|गिरफ्तार|जांच|कोहनी|एफआईआर|हत्या/i.test(headline);
    const isFarmerOrGov = /किसान|एमएसपी|योजना|विकास|सड़क|मुआवजा|पोर्टल|बजट|बिजली|पानी/i.test(headline);

    const location = isHisar ? "हिसार" : isAssembly ? "चंडीगढ़/विधानसभा" : "हरियाणा";

    const parts = headline.split(/[:|—–-]/).map((s) => s.trim()).filter(Boolean);
    const mainEvent = parts[0] || headline;
    const subStatement = parts[1] || "";

    let p1 = `**${location} | ${dateStr} (राजनीति का अखाड़ा ब्यूरो)**: ${headline}। `;
    if (subStatement) {
      p1 += `इस ताज़ा घटनाक्रम में "${subStatement}" का बयान व बिंदु सबसे प्रमुखता से सामने आया है। `;
    }
    p1 += `इस मामले को लेकर प्रदेश भर के राजनीतिक एवं प्रशासनिक हलकों में चर्चाओं का बाज़ार गर्म हो गया है।`;

    let p2 = "";
    if (isAssembly) {
      p2 += `हरियाणा विधानसभा और प्रदेश की सियासत में इस विषय पर तीखी नोकझोंक और खींचतान देखने को मिली है। सदन के भीतर सत्तापक्ष और विपक्ष के दिग्गज नेताओं ने इस पर अपना-अपना कड़ा रुख अख्तियार किया। `;
      if (subStatement) {
        p2 += `नेताओं ने साफ तौर पर कहा कि "${subStatement}" जैसे गंभीर विषयों पर सरकार को स्पष्ट जवाबदेही तय करनी होगी। `;
      } else {
        p2 += `पक्ष और विपक्ष के बीच हुई तीखी बहस के बाद राजनीतिक माहौल में काफी गर्माहट देखी जा रही है। `;
      }
    } else if (isCrimeOrPolice) {
      p2 += `मामले की संवेदनशीलता और कानून-व्यवस्था को देखते हुए संबंधित विभाग और पुलिस बल पूरी तरह सक्रिय हो गया है। `;
      p2 += `पूरी घटना और उसके सभी पहलुओं की विस्तृत जांच की जा रही है। `;
      if (subStatement) {
        p2 += `विशेष रूप से "${subStatement}" के बाद जांच अधिकारियों पर निष्पक्ष और त्वरित कार्रवाई का दबाव बढ़ गया है। `;
      }
    } else if (isFarmerOrGov) {
      p2 += `जनसरोकार और नीतिगत व्यवस्था से जुड़े इस बड़े मामले पर विभिन्न संगठनों और आम नागरिकों की तीखी प्रतिक्रिया देखने को मिली है। `;
      p2 += `संबंधित पक्षों का कहना है कि जनहित के मुद्दों पर शासन-प्रशासन को पारदर्शी और ठोस फैसले लेने चाहिए। `;
    } else {
      p2 += `पूरे मामले के प्रत्यक्षदर्शियों और स्थानीय सूत्रों के अनुसार, घटनाक्रम के पीछे कई अहम कारण जुड़े हुए हैं। `;
      p2 += `संबंधित पक्षों की ओर से बयान सामने आने के बाद अब आगामी कदमों पर सभी की निगाहें टिकी हैं। `;
    }

    let p3 = `राजनीतिक और सामाजिक जानकारों का मानना है कि "${mainEvent}" का यह प्रकरण आने वाले दिनों में और गहरा असर छोड़ सकता है। `;
    if (isAssembly) {
      p3 += `आगामी चुनावी और विधायी रणनीति के तहत विपक्ष इस मुद्दे को लेकर सरकार को घेरने की तैयारी में है, वहीं सत्तापक्ष भी अपने तर्कों के साथ मजबूती से डटा है। `;
    } else {
      p3 += `स्थानीय स्तर पर जनहित और प्रशासनिक जवाबदेही को लेकर लोग लगातार स्थिति पर नज़र बनाए हुए हैं। `;
    }

    let p4 = `इस पूरे घटनाक्रम से जुड़े हर नए मोड़, आधिकारिक बयान और कानूनी व प्रशासनिक अपडेट पर 'राजनीति का अखाड़ा' की टीम लगातार नज़र बनाए हुए है।`;

    const blocks = [
      { type: "paragraph" as const, text: p1 },
      { type: "paragraph" as const, text: p2 },
      { type: "paragraph" as const, text: p3 },
      { type: "paragraph" as const, text: p4 },
    ];

    const markdown = `## ${headline}

${p1}

### मुख्य घटनाक्रम एवं ब्यौरा

${p2}

### राजनीतिक व सामाजिक प्रभाव

${p3}

---
*${p4}*`;

    const excerpt = (headline + " — पढ़ें पूरे घटनाक्रम, बयानों और राजनीतिक प्रभाव पर 'राजनीति का अखाड़ा' की विशेष रिपोर्ट।").slice(0, 280);

    return { headline, blocks, markdown, excerpt, location, highlight: `${mainEvent} — सियासी हलचल तेज़।` };
  }

  function generateValidSlug(title: string, category: string): string {
    const english = title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const cat = (category || "news").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "news";
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    if (english && english.length >= 3) {
      return `${cat}-${english.slice(0, 80)}-${timestamp}`.replace(/--+/g, "-");
    }
    return `${cat}-${timestamp}-${random}`;
  }

  // 1-Click Publish to Main Website
  async function handleOneClickPublish(item: ViralNewsItem) {
    try {
      setPublishingId(item.id);
      const targetCategoryId = matchCategory(item.category || item.categoryHindi);
      
      let articleData = buildJournalisticArticle(item);
      try {
        const expandRes = await fetch("/api/admin/ai-radar/expand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            category: item.category,
            categoryHindi: item.categoryHindi,
            source: item.source,
            link: item.link,
          }),
        });
        if (expandRes.ok) {
          const expandJson = await expandRes.json();
          if (expandJson.articleData?.article) {
            const exp = expandJson.articleData;
            articleData = {
              headline: exp.headline || articleData.headline,
              blocks: editorTextToBlocks(exp.article),
              markdown: exp.article,
              excerpt: exp.excerpt || articleData.excerpt,
              location: exp.location || articleData.location,
              highlight: exp.highlight || articleData.highlight,
            };
          }
        }
      } catch {
        // fallback
      }

      const validSlug = generateValidSlug(articleData.headline, item.category || "news");

      const payload = {
        title: articleData.headline.slice(0, 160),
        slug: validSlug,
        excerpt: articleData.excerpt,
        content: articleData.blocks,
        categoryId: targetCategoryId,
        authorName: currentUser?.name || "संपादक मंडल",
        status: "PUBLISHED",
        publishedAt: new Date().toISOString(),
        trending: true,
        location: articleData.location || "हरियाणा",
        tags: [item.categoryHindi || "हरियाणा", "ताज़ा खबर", "राजनीति"],
      };

      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok) {
        setPublishedMap((prev) => ({ ...prev, [item.id]: true }));
        flash("🚀 खबर तुरंत मुख्य वेबसाइट पर पब्लिश हो गई!");
        if (livePreviewItem?.id === item.id) setLivePreviewItem(null);
        if (onRefresh) onRefresh();
      } else {
        flash(resData.error ?? "पब्लिश विफल - पुनः प्रयास करें");
      }
    } catch {
      flash("पब्लिश त्रुटि");
    } finally {
      setPublishingId("");
    }
  }

  // Open Full Post Editor for Custom Edit
  async function handleEditBeforePublish(item: ViralNewsItem) {
    if (!onOpenEditor) return;
    const targetCategoryId = matchCategory(item.category || item.categoryHindi);
    let articleData = buildJournalisticArticle(item);

    try {
      const expandRes = await fetch("/api/admin/ai-radar/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          category: item.category,
          categoryHindi: item.categoryHindi,
          source: item.source,
          link: item.link,
        }),
      });
      if (expandRes.ok) {
        const expandJson = await expandRes.json();
        if (expandJson.articleData?.article) {
          const exp = expandJson.articleData;
          articleData = {
            headline: exp.headline || articleData.headline,
            blocks: editorTextToBlocks(exp.article),
            markdown: exp.article,
            excerpt: exp.excerpt || articleData.excerpt,
            location: exp.location || articleData.location,
            highlight: exp.highlight || articleData.highlight,
          };
        }
      }
    } catch {
      // fallback
    }

    const validSlug = generateValidSlug(articleData.headline, item.category || "news");

    onOpenEditor({
      title: articleData.headline,
      slug: validSlug,
      excerpt: articleData.excerpt,
      content: articleData.markdown,
      categoryId: targetCategoryId,
      location: articleData.location,
      tags: `${item.categoryHindi || "हरियाणा"}, ताज़ा खबर, राजनीति`,
      highlight: articleData.highlight,
      seoTitle: articleData.headline,
      seoDescription: articleData.excerpt.slice(0, 160),
    });
  }

  // Load Gemini DB Data
  const loadGeminiData = useCallback(async () => {
    setGeminiLoading(true);
    try {
      const [listRes, settingsRes] = await Promise.all([
        fetch("/api/admin/ai-radar"),
        fetch("/api/admin/ai-radar/settings"),
      ]);
      if (listRes.ok) {
        const data = await listRes.json();
        setDrafts(data.drafts ?? []);
        setStats(data.stats ?? null);
        setLogs(data.logs ?? []);
        setApiKeys(data.apiKeys ?? null);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings ?? null);
        setApiKeys((prev) => prev ?? data.apiKeys ?? null);
      }
    } finally {
      setGeminiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mainTab === "gemini") {
      void loadGeminiData();
    }
  }, [mainTab, loadGeminiData]);

  return (
    <div className="ai-radar-theme">
      {/* Top Header */}
      <PanelHeader
        title="AI न्यूज़ रूम व वायरल रडार"
        subtitle="हिसार, हरियाणा और देश भर की ताज़ा खबरों का लाइव AI स्ट्रीम — 1 क्लिक में सीधे वेबसाइट पर पब्लिश करें"
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => (mainTab === "live" ? fetchLiveNews(true) : void loadGeminiData())}
              className="btn btn-ghost flex items-center gap-1.5"
              disabled={liveLoading || geminiLoading}
            >
              <RefreshCw size={16} className={liveLoading || geminiLoading ? "animate-spin" : ""} /> ताज़ा करें
            </button>
          </div>
        }
      />

      {/* Main Mode Navigation */}
      <div className="mt-5 flex flex-wrap gap-2 border-b pb-3" style={{ borderColor: "var(--line)" }}>
        <button
          onClick={() => setMainTab("live")}
          className={"flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition " + (
            mainTab === "live"
              ? "bg-red-600 text-white shadow-md"
              : "surface border hover:bg-black/5 dark:hover:bg-white/5"
          )}
        >
          <span className={"h-2.5 w-2.5 rounded-full " + (mainTab === "live" ? "bg-white animate-ping" : "bg-red-600")}></span>
          🔴 लाइव वायरल रडार (तैयार खबरें)
        </button>

        <button
          onClick={() => setMainTab("gemini")}
          className={"flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition " + (
            mainTab === "gemini"
              ? "bg-indigo-700 text-white shadow-md"
              : "surface border hover:bg-black/5 dark:hover:bg-white/5"
          )}
        >
          <Settings2 size={16} />
          ⚙️ AI इंजन व सेटिंग्स
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LIVE VIRAL RADAR (ONE-CLICK PUBLISH)              */}
      {/* ======================================================== */}
      {mainTab === "live" && (
        <div className="mt-6">
          {/* Filter Bar */}
          <div className="surface rounded-2xl p-4 border shadow-sm" style={{ borderColor: "var(--line)" }}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="खबर, नेता, पार्टी या शहर खोजें (जैसे: हिसार, हुड्डा, सैनी, चुनाव)..."
                  className="input !pl-10 !py-2.5 text-sm w-full"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: "all", label: "⚡ सभी" },
                  { id: "hisar", label: "📍 हिसार" },
                  { id: "haryana", label: "🌾 हरियाणा" },
                  { id: "politics", label: "🏛️ राजनीति" },
                  { id: "india", label: "🇮🇳 देश" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setLiveCategory(tab.id)}
                    className={"whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition " + (
                      liveCategory === tab.id
                        ? "bg-[var(--brand)] text-white"
                        : "surface border hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                    style={{ borderColor: liveCategory === tab.id ? "transparent" : "var(--line)" }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* News Stream List */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3 text-sm font-bold text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Flame className="text-red-600" size={18} />
                ताज़ा ट्रेंडिंग खबरें ({filteredLiveNews.length})
              </span>
              <span className="text-xs text-green-600 font-black">
                ✓ 1-क्लिक पब्लिश दबाते ही खबर आपकी वेबसाइट पर लाइव हो जाएगी
              </span>
            </div>

            {liveLoading && liveNews.length === 0 ? (
              <div className="surface rounded-2xl py-16 text-center border" style={{ borderColor: "var(--line)" }}>
                <div className="text-4xl animate-bounce">📡</div>
                <p className="mt-3 font-bold text-neutral-600 dark:text-neutral-400">
                  AI रडार हिसार और हरियाणा की खबरें स्कैन कर रहा है...
                </p>
              </div>
            ) : filteredLiveNews.length === 0 ? (
              <div className="surface rounded-2xl py-16 text-center border" style={{ borderColor: "var(--line)" }}>
                <p className="text-neutral-500 font-bold">कोई खबर नहीं मिली। कृपया अन्य कीवर्ड या श्रेणी चुनें।</p>
              </div>
            ) : (
              <div className="grid gap-3.5">
                {filteredLiveNews.map((item) => {
                  const isPublished = !!publishedMap[item.id];
                  const isPublishing = publishingId === item.id;
                  const isHighViral = item.score >= 85;

                  return (
                    <div
                      key={item.id}
                      className={"surface flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl p-4 sm:p-5 border transition hover:shadow-md " + (
                        isPublished ? "border-green-500 bg-green-50/20 dark:bg-green-950/20" : ""
                      )}
                      style={{ borderColor: isPublished ? undefined : "var(--line)" }}
                    >
                      {/* Left: Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                          <span className="rounded-md bg-blue-100 px-2 py-0.5 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                            {item.categoryHindi || item.category}
                          </span>
                          <span className="text-neutral-500">📰 {item.source}</span>
                          <span className="text-neutral-400">• ⏰ {item.timeAgoHindi}</span>
                          {isPublished && (
                            <span className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-green-800 dark:bg-green-950 dark:text-green-200 font-black">
                              <Check size={12} /> वेबसाइट पर लाइव प्रकाशित
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 text-base sm:text-lg font-bold leading-snug text-neutral-900 dark:text-neutral-100">
                          {item.title}
                        </h3>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {/* One-Click Publish Button */}
                          <button
                            onClick={() => handleOneClickPublish(item)}
                            disabled={isPublishing || isPublished}
                            className={"btn text-xs font-black flex items-center gap-1.5 !py-2 !px-3.5 shadow " + (
                              isPublished
                                ? "!bg-green-700 !text-white opacity-90 cursor-default"
                                : "!bg-emerald-600 hover:!bg-emerald-700 !text-white"
                            )}
                          >
                            {isPublishing ? (
                              <>
                                <Loader2 size={14} className="animate-spin" /> पब्लिश हो रहा है...
                              </>
                            ) : isPublished ? (
                              <>
                                <Check size={14} /> पब्लिश हो चुका
                              </>
                            ) : (
                              <>
                                <Send size={14} /> 🚀 1-क्लिक पब्लिश करें
                              </>
                            )}
                          </button>

                          {/* Edit / Draft in Post Editor */}
                          <button
                            onClick={() => handleEditBeforePublish(item)}
                            className="btn btn-ghost !py-2 !px-3 text-xs font-bold flex items-center gap-1 border"
                            style={{ borderColor: "var(--line)" }}
                            title="एडिटर में खोलें और फोटो या टेक्स्ट बदलें"
                          >
                            <FilePenLine size={14} /> संपादित / ड्राफ्ट
                          </button>

                          {/* Preview Modal */}
                          <button
                            onClick={() => setLivePreviewItem(item)}
                            className="btn btn-ghost !py-2 !px-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-900"
                            title="पूर्वावलोकन"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Source Link */}
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost !py-2 !px-2.5 text-xs text-neutral-400 hover:text-neutral-700"
                            title="मूल सोर्स देखें"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>

                      {/* Right: Viral Score */}
                      <div
                        className={"flex md:flex-col items-center justify-center rounded-2xl p-3 text-center min-w-[80px] shrink-0 border " + (
                          isHighViral
                            ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:border-red-900"
                            : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900"
                        )}
                      >
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

          {/* Live Preview Modal */}
          {livePreviewItem && (() => {
            const previewData = buildJournalisticArticle(livePreviewItem);
            return (
              <div
                className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-xs"
                onClick={() => setLivePreviewItem(null)}
              >
                <div
                  className="surface max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl border"
                  style={{ borderColor: "var(--line)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--line)" }}>
                    <span className="text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 px-2.5 py-1 rounded-md">
                      {livePreviewItem.categoryHindi || livePreviewItem.category} • AI तैयार समाचार
                    </span>
                    <span className="text-xs font-bold text-red-600">वायरल स्कोर: {livePreviewItem.score}</span>
                  </div>

                  <h2 className="mt-4 text-xl font-black leading-snug">{previewData.headline}</h2>

                  <div className="mt-4 space-y-3 rounded-xl bg-black/5 dark:bg-white/5 p-5 text-sm leading-relaxed">
                    {previewData.blocks.map((b, idx) => (
                      <p key={idx} className={idx === 0 ? "font-semibold text-neutral-900 dark:text-neutral-100" : "text-neutral-700 dark:text-neutral-300"}>
                        {b.text}
                      </p>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                    <button onClick={() => setLivePreviewItem(null)} className="btn btn-ghost text-sm">
                      बंद करें
                    </button>
                    <button
                      onClick={() => {
                        handleEditBeforePublish(livePreviewItem);
                        setLivePreviewItem(null);
                      }}
                      className="btn btn-ghost border text-sm font-bold"
                      style={{ borderColor: "var(--line)" }}
                    >
                      ✏️ एडिटर में खोलें / एडिट करें
                    </button>
                    <button
                      onClick={() => handleOneClickPublish(livePreviewItem)}
                      disabled={publishingId === livePreviewItem.id}
                      className="btn btn-primary !bg-emerald-600 hover:!bg-emerald-700 text-sm font-bold"
                    >
                      {publishingId === livePreviewItem.id ? "पब्लिश हो रहा है..." : "🚀 तुरंत पब्लिश करें"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: GEMINI AI ENGINE & SETTINGS                       */}
      {/* ======================================================== */}
      {mainTab === "gemini" && (
        <div className="mt-6">
          <div className="flex gap-2 border-b pb-2" style={{ borderColor: "var(--line)" }}>
            {(['dashboard', 'settings'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setGeminiTab(t)}
                className={"rounded-lg px-4 py-2 text-xs font-bold " + (
                  geminiTab === t ? "bg-indigo-700 text-white" : "hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                )}
              >
                {t === "dashboard" ? "ड्राफ्ट डेटाबेस" : "Gemini API सेटिंग्स"}
              </button>
            ))}
          </div>

          {geminiTab === "settings" && settings ? (
            <div className="surface mt-6 max-w-2xl rounded-xl p-6 border" style={{ borderColor: "var(--line)" }}>
              <h2 className="flex items-center gap-2 text-lg font-black">
                <Settings2 size={20} /> Gemini व GNews सेटिंग्स
              </h2>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-1 text-sm">
                  <span className="font-bold">AI Provider</span>
                  <input className="input" value="Gemini 1.5 Flash (server-side)" disabled />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-bold">Gemini API Key</span>
                  <input
                    type="password"
                    className="input"
                    autoComplete="off"
                    value={geminiApiKeyInput}
                    placeholder={apiKeys?.geminiConfigured ? "•••••••• (configured)" : "Vercel GEMINI_API_KEY या यहाँ दर्ज करें"}
                    onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  />
                  AI Radar सक्षम करें
                </label>
                <button
                  onClick={async () => {
                    if (!settings) return;
                    setBusy("settings");
                    const payload: Record<string, unknown> = { ...settings };
                    if (geminiApiKeyInput.trim()) payload.geminiApiKey = geminiApiKeyInput.trim();
                    const res = await fetch("/api/admin/ai-radar/settings", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
                    setBusy("");
                    if (res.ok) {
                      setGeminiApiKeyInput("");
                      flash("सेटिंग्स सुरक्षित हुईं");
                    } else {
                      flash("त्रुटि");
                    }
                  }}
                  className="btn btn-primary !bg-indigo-700 mt-2"
                  disabled={busy === "settings"}
                >
                  {busy === "settings" ? "..." : "सेटिंग्स सुरक्षित करें"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="surface rounded-xl p-5 border" style={{ borderColor: "var(--line)" }}>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  💡 <strong>सुझाव:</strong> लाइव वायरल रडार टैब का उपयोग करके आप बिना किसी API कुंजी के भी सीधे हिसार और हरियाणा की खबरें 1-क्लिक में अपनी वेबसाइट पर पब्लिश कर सकते हैं।
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
