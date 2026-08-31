"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, Plus, Sparkles, Flame, RefreshCw, X, Check } from "lucide-react";
import {
  AD_POSITION_LABELS,
  STATUS_LABELS,
  slugify,
  blocksToEditorText,
  editorTextToBlocks,
  type ContentBlock,
} from "@/lib/types";
import { ErrorBlock, LoadingBlock, MediaPickerModal, PanelHeader, StorageBanner } from "./shared";
import type { ArticleRow, MediaItem, Meta, StorageStatus, User } from "./types";

export function PostEditor({
  meta,
  article,
  initialData,
  currentUser,
  close,
  onSaved,
}: {
  meta: Meta;
  article: ArticleRow | null;
  initialData?: {
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
  } | null;
  currentUser?: User | null;
  close: () => void;
  onSaved: (message?: string) => void;
}) {
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState(article?.title ?? initialData?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? (initialData?.slug || (initialData?.title ? slugify(initialData.title) : "")));
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? initialData?.excerpt ?? "");
  const [body, setBody] = useState(article?.content ? blocksToEditorText(article.content) : (initialData?.content ?? ""));
  const [highlight, setHighlight] = useState(article?.highlight ?? initialData?.highlight ?? "");
  const [location, setLocation] = useState(article?.location ?? initialData?.location ?? "");
  const [status, setStatus] = useState(article?.status ?? "DRAFT");
  const [categoryId, setCategoryId] = useState(article?.category.id ?? initialData?.categoryId ?? meta.categories[0]?.id ?? "");
  const [authorName, setAuthorName] = useState(article?.author.name ?? currentUser?.name ?? "");
  const [tags, setTags] = useState(article?.tags.map((t) => t.tag.name).join(", ") ?? initialData?.tags ?? "");
  const [featured, setFeatured] = useState(article?.featured ?? false);
  const [breaking, setBreaking] = useState(article?.breaking ?? false);
  const [trending, setTrending] = useState(article?.trending ?? false);
  const [seoTitle, setSeoTitle] = useState(article?.seoTitle ?? initialData?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(article?.seoDescription ?? initialData?.seoDescription ?? "");
  const [videoUrl, setVideoUrl] = useState(article?.videoUrl ?? "");
  const [scheduledAt, setScheduledAt] = useState(article?.scheduledAt?.slice(0, 16) ?? "");
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(article?.featuredImage?.id ?? null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<{ url: string; alt?: string | null } | null>(
    article?.featuredImage ? { url: article.featuredImage.url, alt: article.featuredImage.alt } : null,
  );
  const [featuredImageAlt, setFeaturedImageAlt] = useState(article?.featuredImage?.alt ?? "");
  const [featuredUrlInput, setFeaturedUrlInput] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"featured" | "content">("featured");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);

  // AI Auto-Fill States
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiNewsList, setAiNewsList] = useState<Array<{ id: string; title: string; category: string; categoryHindi: string; source: string; score: number }>>([]);
  const [aiNewsLoading, setAiNewsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.slug) setSlug(initialData.slug);
      if (initialData.excerpt) setExcerpt(initialData.excerpt);
      if (initialData.content) setBody(initialData.content);
      if (initialData.highlight) setHighlight(initialData.highlight);
      if (initialData.location) setLocation(initialData.location);
      if (initialData.categoryId) setCategoryId(initialData.categoryId);
      if (initialData.tags) setTags(initialData.tags);
      if (initialData.seoTitle) setSeoTitle(initialData.seoTitle);
      if (initialData.seoDescription) setSeoDescription(initialData.seoDescription);
    }
  }, [initialData]);

  function loadAiNews() {
    setAiNewsLoading(true);
    fetch("https://rajniti-ai-newsroom.vercel.app/api/news")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAiNewsList(data);
      })
      .catch(() => undefined)
      .finally(() => setAiNewsLoading(false));
  }

  function applyAiNewsItem(item: { title: string; category: string; categoryHindi: string; source: string }) {
    const headline = item.title.replace(/\s*\.\.\.\s*$/, "").replace(/\s*-\s*[A-Za-z\u0900-\u097F\s]+$/, "").trim();
    const catLower = (item.category || "").toLowerCase();
    const loc = catLower === "hisar" ? "हिसार" : catLower === "haryana" ? "हरियाणा/चंडीगढ़" : catLower === "politics" ? "राजनीतिक डेस्क" : "देश/नई दिल्ली";
    const dateStr = new Intl.DateTimeFormat("hi-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

    const p1 = `${loc} | ${dateStr} (राजनीति का अखाड़ा ब्यूरो): ${headline}। इस ताज़ा घटनाक्रम को लेकर क्षेत्र और संबंधित हलकों में व्यापक चर्चा का माहौल बना हुआ है तथा प्रशासनिक स्तर पर भी हलचल तेज़ हो गई है।`;
    const p2 = `प्राप्त विवरण के अनुसार, पूरे मामले को लेकर संबंधित विभागों और अधिकारियों द्वारा स्थिति की लगातार निगरानी की जा रही है। घटना से जुड़े मुख्य बिंदुओं पर नज़र डालें तो इस विषय पर विभिन्न पक्षों द्वारा अपनी-अपनी प्रतिक्रियाएं सामने आई हैं। स्थानीय नागरिकों एवं संबंधित वर्ग की ओर से भी इस पर गंभीरता से ध्यान दिया जा रहा है।`;
    const p3 = `राजनीतिक और सामाजिक जानकारों का मानना है कि इस घटनाक्रम के आगामी दिनों में कई अहम प्रभाव देखने को मिल सकते हैं। क्षेत्र में व्यवस्था बनाए रखने और जनसरोकार के मुद्दों को प्राथमिकता देने के लिए संबंधित तंत्र भी पूरी तरह सक्रिय है।`;
    const p4 = `इस पूरे मामले पर आगे की कार्रवाई और हर बड़े अपडेट पर 'राजनीति का अखाड़ा' की टीम लगातार नज़र बनाए हुए है। विश्वसनीय और निष्पक्ष समाचारों के लिए जुड़े रहें।`;

    const md = `## ${headline}

**${loc} | ${dateStr} (राजनीति का अखाड़ा ब्यूरो)**

${headline}। इस ताज़ा घटनाक्रम को लेकर क्षेत्र और संबंधित हलकों में व्यापक चर्चा का माहौल बना हुआ है तथा प्रशासनिक स्तर पर भी हलचल तेज़ हो गई है।

### मुख्य घटनाक्रम व विवरण

${p2}

### प्रभाव एवं आगामी रणनीति

${p3}

---
*${p4}*`;

    const safeSlug = (item.category ? item.category.toLowerCase() : "news") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
    const matchedCat = meta.categories.find(
      (c) =>
        c.slug.toLowerCase() === (item.category || "").toLowerCase() ||
        c.name.toLowerCase() === (item.categoryHindi || "").toLowerCase() ||
        (item.category || "").toLowerCase().includes(c.slug.toLowerCase())
    );

    setTitle(headline);
    setSlug(safeSlug);
    setExcerpt((headline + " | राजनीति का अखाड़ा पर ताज़ा समाचार व विस्तृत रिपोर्ट।").slice(0, 280));
    setBody(md);
    setHighlight(`${headline} — प्रशासनिक और राजनीतिक हलकों में हलचल।`);
    setLocation(loc);
    if (matchedCat) setCategoryId(matchedCat.id);
    setTags(`${item.categoryHindi || "हरियाणा"}, ताज़ा खबर, राजनीति`);
    setSeoTitle(headline);
    setSeoDescription((headline + " | ताज़ा समाचार अपडेट।").slice(0, 160));
    setAiModalOpen(false);
  }

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => setStorage(d.storage ?? null))
      .catch(() => undefined);
  }, []);

  const content: ContentBlock[] = editorTextToBlocks(body);

  function openMediaPicker(target: "featured" | "content") {
    setMediaPickerTarget(target);
    setMediaPickerOpen(true);
  }

  function handleMediaSelect(item: MediaItem) {
    if (mediaPickerTarget === "featured") {
      setFeaturedImageId(item.id);
      setFeaturedImagePreview({ url: item.url, alt: item.alt });
      setFeaturedImageAlt(item.alt ?? "");
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      }
      return;
    }
    insertImageMarkdown(item.url, item.alt ?? "");
  }

  async function updateFeaturedAlt(mediaId: string, alt: string) {
    await fetch(`/api/admin/media/${mediaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt }),
    });
    setFeaturedImagePreview((prev) => (prev ? { ...prev, alt } : prev));
  }

  function insertImageMarkdown(url: string, alt: string) {
    const snippet = `![${alt}](${url})`;
    const ta = bodyTextareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = body.slice(0, start);
      const after = body.slice(end);
      const prefix = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
      const next = `${before}${prefix}${snippet}${after ? `\n\n${after}` : ""}`;
      setBody(next);
      setTimeout(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + prefix.length + snippet.length;
      }, 0);
    } else {
      setBody((b) => (b.trim() ? `${b}\n\n${snippet}` : snippet));
    }
  }

  async function setFeaturedFromUrl() {
    const url = featuredUrlInput.trim();
    if (!url) return;
    const res = await fetch("/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (res.ok) {
      setFeaturedImageId(data.media.id);
      setFeaturedImagePreview({ url: data.media.url, alt: data.media.alt });
      setFeaturedUrlInput("");
    } else {
      setError(data.error ?? "चित्र URL सेट नहीं हो सका");
    }
  }

  async function uploadFeatured(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    setFeaturedImagePreview({ url: objectUrl, alt: featuredImageAlt || title || file.name });

    if (!storage?.configured) {
      setError("स्टोरेज कॉन्फ़िग नहीं — Cloudinary सेट करें, या URL/लाइब्रेरी उपयोग करें");
      e.target.value = "";
      return;
    }

    setUploadingFeatured(true);
    const form = new FormData();
    form.append("file", file);
    if (featuredImageAlt.trim()) form.append("alt", featuredImageAlt.trim());
    else if (title.trim()) form.append("alt", title.trim());
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const data = await res.json();
    setUploadingFeatured(false);
    if (res.ok) {
      setFeaturedImageId(data.media.id);
      setFeaturedImagePreview({ url: data.media.url, alt: data.media.alt });
      setFeaturedImageAlt(data.media.alt ?? "");
      URL.revokeObjectURL(objectUrl);
      setLocalPreviewUrl(null);
    } else {
      setError(data.error ?? "अपलोड विफल");
    }
    e.target.value = "";
  }

  function insertImageFromPrompt() {
    const url = window.prompt("चित्र URL दर्ज करें (https://...)");
    if (!url?.trim()) return;
    const alt = window.prompt("Alt टेक्स्ट (वैकल्पिक)", "") ?? "";
    insertImageMarkdown(url.trim(), alt);
  }

  async function save(e: React.FormEvent, publish = false) {
    e.preventDefault();
    const nextStatus = publish ? "PUBLISHED" : status;
    if (title.trim().length < 10) {
      setError("शीर्षक कम से कम 10 अक्षर");
      return;
    }
    if (!categoryId) {
      setError("श्रेणी चुनें");
      return;
    }
    if (!authorName.trim()) {
      setError("लेखक का नाम दर्ज करें");
      return;
    }
    if (nextStatus !== "DRAFT") {
      if (excerpt.trim().length < 20) {
        setError("प्रकाशन के लिए सारांश कम से कम 20 अक्षर");
        return;
      }
      if (!body.trim()) {
        setError("प्रकाशन के लिए मुख्य सामग्री आवश्यक है");
        return;
      }
    }
    setSaving(true);
    if (featuredImageId && featuredImageAlt.trim()) {
      await updateFeaturedAlt(featuredImageId, featuredImageAlt.trim());
    }
    const payload = {
      title,
      slug: slug || slugify(title),
      excerpt,
      content,
      highlight,
      location,
      status: nextStatus,
      categoryId,
      authorName: authorName.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      featured,
      breaking,
      trending,
      seoTitle,
      seoDescription,
      videoUrl: videoUrl.trim() || undefined,
      featuredImageId,
      scheduledAt: nextStatus === "SCHEDULED" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };
    const res = await fetch(article ? `/api/admin/articles/${article.id}` : "/api/admin/articles", {
      method: article ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      const label = STATUS_LABELS[nextStatus as keyof typeof STATUS_LABELS] ?? nextStatus;
      const msg = nextStatus === "PUBLISHED" ? "प्रकाशित — होमपेज पर दिखेगा" : `ड्राफ्ट सुरक्षित (${label})`;
      onSaved(msg);
    } else {
      const d = await res.json();
      setError(d.error ?? "सुरक्षित नहीं हो सका");
    }
  }

  const displayPreviewUrl = featuredImagePreview?.url ?? null;
  const displayAlt = featuredImageAlt || featuredImagePreview?.alt || title || "Featured image";

  const statusBadgeClass =
    status === "PUBLISHED"
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      : status === "DRAFT"
        ? "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
        : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";

  return (
    <form onSubmit={(e) => save(e, false)}>
      <MediaPickerModal open={mediaPickerOpen} onClose={() => setMediaPickerOpen(false)} onSelect={handleMediaSelect} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={close} className="muted text-sm">
            ← समाचार पर लौटें
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black">{article ? "समाचार संपादित करें" : "नया समाचार"}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass}`}>
              {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
            </span>
          </div>
          {status === "DRAFT" && (
            <p className="muted mt-1 text-sm">ड्राफ्ट साइट पर नहीं दिखता — प्रकाशित करने के लिए &quot;प्रकाशित करें&quot; दबाएं।</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAiModalOpen(true);
              loadAiNews();
            }}
            className="btn !bg-amber-500 hover:!bg-amber-600 !text-white text-xs font-black flex items-center gap-1.5 shadow"
          >
            <Sparkles size={15} /> ⚡ AI से समाचार ऑटो-भरें
          </button>
          <button type="button" onClick={close} className="btn btn-ghost">
            रद्द
          </button>
          <button type="submit" disabled={saving} className="btn btn-ghost">
            {saving ? "सुरक्षित..." : "ड्राफ्ट सहेजें"}
          </button>
          <button type="button" disabled={saving} onClick={(e) => save(e, true)} className="btn btn-primary">
            {saving ? "प्रकाशित..." : "प्रकाशित करें"}
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-red-600">{error}</p>}

      {/* AI Quick News Picker Modal */}
      {aiModalOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setAiModalOpen(false)}
        >
          <div
            className="surface max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl border"
            style={{ borderColor: "var(--line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--line)" }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="text-base font-black">AI न्यूज़ रडार — ताज़ा खबरें</h3>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="btn btn-ghost !p-1.5"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-xs text-neutral-500 font-bold">
              किसी भी खबर पर क्लिक करें — शीर्षक, सारांश, 4-पैराग्राफ संपूर्ण हिंदी लेख, श्रेणी और टैग तुरंत फॉर्म में भर जाएंगे।
            </p>

            {aiNewsLoading ? (
              <div className="py-12 text-center">
                <RefreshCw size={24} className="mx-auto animate-spin text-amber-500" />
                <p className="mt-2 text-xs font-bold text-neutral-500">ताज़ा खबरें लोड हो रही हैं...</p>
              </div>
            ) : aiNewsList.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-bold text-neutral-500">कोई खबर नहीं मिली।</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {aiNewsList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => applyAiNewsItem(item)}
                    className="surface text-left rounded-xl p-3.5 border transition hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 flex items-start justify-between gap-3"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">
                          {item.categoryHindi || item.category}
                        </span>
                        <span className="text-neutral-400">📰 {item.source}</span>
                      </div>
                      <h4 className="mt-1.5 text-sm font-bold leading-snug line-clamp-2 text-neutral-900 dark:text-neutral-100">
                        {item.title}
                      </h4>
                    </div>
                    <span className="shrink-0 text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                      🔥 {item.score}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="mt-4">
        <StorageBanner storage={storage} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_330px]">
        <div className="surface grid gap-5 rounded-xl p-5">
          <label className="font-bold">
            शीर्षक
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input mt-2" maxLength={160} />
          </label>
          <label className="font-bold">
            सारांश
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="input mt-2 min-h-24" maxLength={280} />
          </label>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">मुख्य सामग्री</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={insertImageFromPrompt} className="btn btn-ghost text-xs">
                  <ImageIcon size={14} /> चित्र जोड़ें
                </button>
                <button type="button" onClick={() => openMediaPicker("content")} className="btn btn-ghost text-xs">
                  <ImageIcon size={14} /> लाइब्रेरी से
                </button>
              </div>
            </div>
            <p className="muted mt-1 text-xs">## शीर्षक, &gt; उद्धरण, ![alt](url) चित्र</p>
            <textarea ref={bodyTextareaRef} value={body} onChange={(e) => setBody(e.target.value)} className="input mt-2 min-h-72 font-mono text-sm" />
          </div>
          <label className="font-bold">
            हाइलाइट
            <textarea value={highlight} onChange={(e) => setHighlight(e.target.value)} className="input mt-2 min-h-20" />
          </label>
        </div>
        <div className="grid content-start gap-5">
          <div className="surface grid gap-4 rounded-xl p-5">
            <h2 className="font-black">फीचर्ड चित्र</h2>
            {displayPreviewUrl ? (
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <Image src={displayPreviewUrl} alt={displayAlt} fill className="object-cover" unoptimized />
                {uploadingFeatured && (
                  <div className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-bold text-white">अपलोड हो रहा है...</div>
                )}
              </div>
            ) : (
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900">
                <ImageIcon className="text-neutral-400" size={32} />
                <span className="muted mt-2 text-xs">गैलरी/फ़ाइल से चित्र चुनें</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadFeatured} disabled={uploadingFeatured} />
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <label className="btn btn-primary cursor-pointer text-xs">
                {uploadingFeatured ? "अपलोड..." : "चित्र चुनें"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadFeatured} disabled={uploadingFeatured} />
              </label>
              <button type="button" onClick={() => openMediaPicker("featured")} className="btn btn-ghost text-xs">
                लाइब्रेरी
              </button>
              {featuredImagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setFeaturedImageId(null);
                    setFeaturedImagePreview(null);
                    setFeaturedImageAlt("");
                    if (localPreviewUrl) {
                      URL.revokeObjectURL(localPreviewUrl);
                      setLocalPreviewUrl(null);
                    }
                  }}
                  className="btn btn-ghost text-xs text-red-600"
                >
                  हटाएं
                </button>
              )}
            </div>
            <label className="text-sm font-bold">
              Alt टेक्स्ट (SEO)
              <input
                value={featuredImageAlt}
                onChange={(e) => setFeaturedImageAlt(e.target.value)}
                onBlur={() => {
                  if (featuredImageId && featuredImageAlt.trim()) void updateFeaturedAlt(featuredImageId, featuredImageAlt.trim());
                }}
                className="input mt-1 text-sm"
                placeholder="चित्र का वर्णन..."
              />
            </label>
            <div className="flex gap-2">
              <input value={featuredUrlInput} onChange={(e) => setFeaturedUrlInput(e.target.value)} className="input flex-1 text-sm" placeholder="https://... चित्र URL" />
              <button type="button" onClick={setFeaturedFromUrl} className="btn btn-ghost text-xs whitespace-nowrap">
                URL सेट
              </button>
            </div>
            <p className="muted text-xs">JPG, PNG, WebP • मोबाइल गैलरी और डेस्कटॉप अपलोड</p>
          </div>
          <div className="surface grid gap-4 rounded-xl p-5">
            <h2 className="font-black">प्रकाशन</h2>
            <label className="text-sm font-bold">
              स्थिति
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input mt-1">
                {Object.keys(STATUS_LABELS).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s as keyof typeof STATUS_LABELS]}
                  </option>
                ))}
              </select>
            </label>
            {status === "SCHEDULED" && (
              <label className="text-sm font-bold">
                निर्धारित समय
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="input mt-1" />
              </label>
            )}
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={breaking} onChange={(e) => setBreaking(e.target.checked)} /> ब्रेकिंग
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> संपादक की पसंद
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={trending} onChange={(e) => setTrending(e.target.checked)} /> ट्रेंडिंग
            </label>
          </div>
          <div className="surface grid gap-4 rounded-xl p-5">
            <h2 className="font-black">वर्गीकरण और SEO</h2>
            <label className="text-sm font-bold">
              श्रेणी
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input mt-1">
                {meta.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold">
              लेखक
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                list="author-suggestions"
                className="input mt-1"
                placeholder="अपना नाम या लेखक का नाम लिखें"
                maxLength={80}
              />
              <datalist id="author-suggestions">
                {meta.authors.map((a) => (
                  <option key={a.id} value={a.name} />
                ))}
              </datalist>
              <p className="muted mt-1 text-xs">नया नाम लिखें या पहले उपयोग किए गए नाम में से चुनें</p>
            </label>
            <label className="text-sm font-bold">
              Slug
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input mt-1" pattern="[a-z0-9-]+" />
            </label>
            <label className="text-sm font-bold">
              Meta शीर्षक
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="input mt-1" />
            </label>
            <label className="text-sm font-bold">
              Meta विवरण
              <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="input mt-1" />
            </label>
            <label className="text-sm font-bold">
              वीडियो URL (वैकल्पिक)
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="input mt-1" placeholder="https://youtube.com/watch?v=..." />
            </label>
            <label className="text-sm font-bold">
              टैग
              <input value={tags} onChange={(e) => setTags(e.target.value)} className="input mt-1" placeholder="हिसार, विकास" />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
