"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3, BellRing, FilePenLine, ImageIcon, LayoutDashboard, LogOut, Menu, MessageSquare,
  Plus, Search, Settings, ShieldCheck, Users, X,
} from "lucide-react";
import { AD_POSITION_LABELS, STATUS_LABELS, slugify, blocksToEditorText, editorTextToBlocks, type ContentBlock } from "@/lib/types";

type User = { id: string; email: string; name: string; role: string };
type Meta = { categories: Array<{ id: string; slug: string; name: string }>; authors: Array<{ id: string; name: string }>; tags: Array<{ id: string; name: string }> };
type ArticleRow = {
  id: string; slug: string; title: string; excerpt: string; status: string; viewCount: number;
  content: ContentBlock[]; highlight?: string | null; location?: string | null;
  featured: boolean; breaking: boolean; trending: boolean; trendingOverride?: number | null;
  seoTitle?: string | null; seoDescription?: string | null; canonicalUrl?: string | null;
  scheduledAt?: string | null; publishedAt?: string | null;
  category: { id: string; name: string }; author: { id: string; name: string };
  featuredImage?: { id: string; url: string; alt?: string | null } | null;
  tags: Array<{ tag: { name: string } }>;
};

type MediaItem = { id: string; url: string; filename: string; alt?: string | null };
type StorageStatus = { provider: string; configured: boolean; message?: string };

const sections = [
  ["dashboard", "डैशबोर्ड", LayoutDashboard], ["posts", "पोस्ट", FilePenLine], ["media", "मीडिया", ImageIcon], ["breaking", "ब्रेकिंग", BellRing],
  ["authors", "लेखक", Users], ["comments", "टिप्पणियां", MessageSquare], ["ads", "विज्ञापन", BarChart3], ["seo", "SEO", Search], ["settings", "सेटिंग्स", Settings],
] as const;

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [active, setActive] = useState<string>("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [editing, setEditing] = useState<ArticleRow | null | "new">(null);
  const [notice, setNotice] = useState("");
  const [dbError, setDbError] = useState("");

  const flash = useCallback((text: string) => { setNotice(text); setTimeout(() => setNotice(""), 2800); }, []);

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user) { router.push("/admin/login"); return; }
      setUser(me.user);
      const [metaRes, articlesRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/meta"), fetch("/api/admin/articles"), fetch("/api/admin/analytics"),
      ]);
      if (!metaRes.ok || !articlesRes.ok) throw new Error("DB");
      setMeta(await metaRes.json());
      setArticles((await articlesRes.json()).articles ?? []);
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      setDbError("");
    } catch {
      setDbError("डेटाबेस कनेक्शन विफल — admin सुविधाएं सीमित हैं।");
    }
  }, [router]);

  useEffect(() => {
    // Initial CMS data load on mount
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch updates admin shell after mount
    void load();
  }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const content = useMemo(() => {
    if (dbError && !meta) return <div className="surface rounded-xl p-8 text-center"><p className="text-red-600">{dbError}</p></div>;
    if (editing) return <PostEditor meta={meta!} article={editing === "new" ? null : editing} close={() => setEditing(null)} onSaved={() => { setEditing(null); load(); flash("सुरक्षित किया गया"); }} />;
    switch (active) {
      case "posts": return <Posts articles={articles} edit={(a) => setEditing(a)} create={() => setEditing("new")} onRefresh={load} flash={flash} />;
      case "media": return <MediaManager flash={flash} />;
      case "breaking": return <BreakingManager flash={flash} />;
      case "authors": return <AuthorsPanel meta={meta!} flash={flash} />;
      case "comments": return <CommentsPanel flash={flash} />;
      case "ads": return <AdsPanel flash={flash} />;
      case "seo": return <SettingsPanel title="SEO नियंत्रण" keys={["site_name", "site_tagline", "site_description"]} flash={flash} />;
      case "settings": return <SettingsPanel title="पोर्टल सेटिंग्स" keys={["contact_email", "facebook_url", "youtube_url", "whatsapp_number"]} flash={flash} />;
      default: return <Dashboard analytics={analytics} articles={articles} create={() => setEditing("new")} openPosts={() => setActive("posts")} />;
    }
  }, [active, editing, articles, analytics, meta, dbError, load, flash]);

  if (!user && !dbError) return <div className="grid min-h-screen place-items-center">लोड हो रहा है...</div>;

  return (
    <div className="admin-grid bg-[var(--background)]">
      <aside className={`${mobileMenu ? "fixed inset-y-0 left-0 z-50 flex" : "hidden"} w-[235px] flex-col bg-[#17191c] p-4 text-white md:flex`}>
        <div className="flex items-center justify-between border-b border-white/10 pb-5"><Link href="/" className="font-black">राजनीति का <span className="text-[#ef4050]">अखाड़ा</span><span className="block text-xs font-medium text-neutral-400">संपादकीय CMS</span></Link><button className="md:hidden" onClick={() => setMobileMenu(false)} aria-label="मेन्यू बंद करें"><X /></button></div>
        <nav className="mt-5 grid gap-1">{sections.map(([id, label, Icon]) => <button onClick={() => { setActive(id); setEditing(null); setMobileMenu(false); }} key={id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold ${active === id && !editing ? "bg-[#a71d2a]" : "hover:bg-white/10"}`}><Icon size={18} />{label}</button>)}</nav>
        <div className="mt-auto rounded-lg bg-white/5 p-3 text-xs text-neutral-400"><ShieldCheck className="mb-2 text-green-400" size={20} />{user?.role ?? "—"} • PostgreSQL CMS</div>
      </aside>
      <main className="min-w-0">
        <header className="surface flex h-16 items-center justify-between border-x-0 border-t-0 px-4 sm:px-7">
          <div className="flex items-center gap-3"><button onClick={() => setMobileMenu(true)} className="btn btn-ghost !p-2 md:hidden"><Menu /></button><div><strong>नमस्ते, {user?.name ?? "संपादक"}</strong></div></div>
          <div className="flex items-center gap-2"><Link href="/" className="btn btn-ghost text-sm">साइट देखें</Link><button onClick={logout} className="btn btn-ghost text-sm"><LogOut size={16} /> लॉगआउट</button></div>
        </header>
        <div className="p-4 sm:p-7">{notice && <div role="status" className="fixed right-5 top-5 z-[80] rounded-lg bg-green-700 px-4 py-3 font-bold text-white shadow-xl">{notice}</div>}{content}</div>
      </main>
    </div>
  );
}

function Dashboard({ analytics, articles, create, openPosts }: { analytics: Record<string, unknown> | null; articles: ArticleRow[]; create: () => void; openPosts: () => void }) {
  const views = analytics?.views as { today: number; week: number; month: number; total: number } | undefined;
  const counts = analytics?.postCounts as { total: number; published: number; draft: number; review: number } | undefined;
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-black">न्यूज़रूम डैशबोर्ड</h1><p className="muted mt-1">DB-आधारित प्रकाशन और विश्लेषण</p></div><button onClick={create} className="btn btn-primary"><Plus size={18} /> नई पोस्ट</button></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["आज के व्यू", views?.today ?? 0], ["7-दिन व्यू", views?.week ?? 0], ["30-दिन व्यू", views?.month ?? 0], ["कुल पोस्ट", counts?.total ?? 0]].map(([a, b]) => <div className="surface rounded-xl p-5" key={String(a)}><p className="muted text-sm">{a}</p><p className="mt-2 text-3xl font-black">{Number(b).toLocaleString("hi-IN")}</p></div>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]"><div className="surface rounded-xl p-5"><div className="flex justify-between"><h2 className="font-black">हाल की पोस्ट</h2><button onClick={openPosts} className="brand text-sm font-bold">सभी देखें</button></div><div className="mt-4 grid gap-1">{articles.slice(0, 5).map((a) => <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-3 last:border-0" style={{ borderColor: "var(--line)" }} key={a.id}><div><p className="line-clamp-1 font-bold">{a.title}</p><span className="muted text-xs">{a.author.name} • {STATUS_LABELS[a.status as keyof typeof STATUS_LABELS] ?? a.status}</span></div><span className="text-xs font-bold text-green-600">{a.viewCount}</span></div>)}</div></div><div className="surface rounded-xl p-5"><h2 className="font-black">कुल व्यू</h2><p className="mt-6 text-center text-5xl font-black brand">{(views?.total ?? 0).toLocaleString("hi-IN")}</p></div></div>
  </>;
}

function Posts({ articles, edit, create, onRefresh, flash }: { articles: ArticleRow[]; edit: (a: ArticleRow) => void; create: () => void; onRefresh: () => void; flash: (s: string) => void }) {
  async function updateStatus(article: ArticleRow, status: string) {
    const res = await fetch(`/api/admin/articles/${article.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, title: article.title, slug: article.slug, excerpt: article.excerpt, categoryId: article.category.id, authorId: article.author.id, content: article.content }),
    });
    if (res.ok) { flash("स्थिति अपडेट"); onRefresh(); } else flash("त्रुटि");
  }
  return <div><div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-black">सभी पोस्ट</h1></div><button onClick={create} className="btn btn-primary"><Plus size={18} /> नई पोस्ट</button></div><div className="surface mt-6 overflow-x-auto rounded-xl"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-black/5 dark:bg-white/5"><tr>{["शीर्षक", "श्रेणी", "लेखक", "स्थिति", "व्यू", "कार्रवाई"].map((h) => <th className="p-4" key={h}>{h}</th>)}</tr></thead><tbody>{articles.map((a) => <tr className="border-t" style={{ borderColor: "var(--line)" }} key={a.id}><td className="max-w-sm p-4 font-bold">{a.title}</td><td className="p-4">{a.category.name}</td><td className="p-4">{a.author.name}</td><td className="p-4"><select value={a.status} onChange={(e) => updateStatus(a, e.target.value)} className="input !w-auto !py-1">{Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s as keyof typeof STATUS_LABELS]}</option>)}</select></td><td className="p-4">{a.viewCount}</td><td className="p-4"><button onClick={() => edit(a)} className="brand font-bold">संपादित</button></td></tr>)}</tbody></table></div></div>;
}

function StorageBanner({ storage }: { storage: StorageStatus | null }) {
  if (!storage || storage.configured) return null;
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <strong>स्टोरेज कॉन्फ़िग नहीं ({storage.provider})</strong>
      <p className="mt-1">{storage.message}</p>
      <p className="mt-1">फ़ाइल अपलोड अभी उपलब्ध नहीं — बाहरी चित्र URL दर्ज करके उपयोग करें, या Vercel में STORAGE_PROVIDER=s3/cloudinary सेट करें।</p>
    </div>
  );
}

function MediaPickerModal({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (item: MediaItem) => void }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => { setMedia(d.media ?? []); setStorage(d.storage ?? null); })
      .catch(() => undefined);
  }, [open]);

  async function addFromUrl() {
    if (!urlInput.trim()) return;
    setAdding(true);
    const res = await fetch("/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlInput.trim() }),
    });
    const data = await res.json();
    setAdding(false);
    if (res.ok) {
      setMedia([data.media, ...media]);
      setUrlInput("");
      onSelect(data.media);
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="surface max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">मीडिया लाइब्रेरी से चुनें</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost !p-2"><X size={18} /></button>
        </div>
        <StorageBanner storage={storage} />
        <div className="mt-4 flex gap-2">
          <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="input flex-1" placeholder="https://example.com/image.jpg" />
          <button type="button" disabled={adding || !urlInput.trim()} onClick={addFromUrl} className="btn btn-primary whitespace-nowrap">{adding ? "..." : "URL जोड़ें"}</button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {media.map((file) => (
            <button type="button" key={file.id} onClick={() => { onSelect(file); onClose(); }} className="surface overflow-hidden rounded-lg text-left ring-2 ring-transparent hover:ring-[var(--brand)]">
              <div className="relative aspect-square"><Image fill src={file.url} alt={file.alt ?? file.filename} className="object-cover" unoptimized /></div>
              <p className="truncate p-2 text-xs font-bold">{file.filename}</p>
            </button>
          ))}
          {!media.length && <p className="col-span-full muted py-6 text-center text-sm">कोई मीडिया नहीं — URL जोड़ें या मीडिया अनुभाग में अपलोड करें</p>}
        </div>
      </div>
    </div>
  );
}

function PostEditor({ meta, article, close, onSaved }: { meta: Meta; article: ArticleRow | null; close: () => void; onSaved: () => void }) {
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(blocksToEditorText(article?.content ?? [{ type: "paragraph", text: "" }]));
  const [highlight, setHighlight] = useState(article?.highlight ?? "");
  const [location, setLocation] = useState(article?.location ?? "");
  const [status, setStatus] = useState(article?.status ?? "DRAFT");
  const [categoryId, setCategoryId] = useState(article?.category.id ?? meta.categories[0]?.id ?? "");
  const [authorId, setAuthorId] = useState(article?.author.id ?? meta.authors[0]?.id ?? "");
  const [tags, setTags] = useState(article?.tags.map((t) => t.tag.name).join(", ") ?? "");
  const [featured, setFeatured] = useState(article?.featured ?? false);
  const [breaking, setBreaking] = useState(article?.breaking ?? false);
  const [trending, setTrending] = useState(article?.trending ?? false);
  const [seoTitle, setSeoTitle] = useState(article?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(article?.seoDescription ?? "");
  const [scheduledAt, setScheduledAt] = useState(article?.scheduledAt?.slice(0, 16) ?? "");
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(article?.featuredImage?.id ?? null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<{ url: string; alt?: string | null } | null>(
    article?.featuredImage ? { url: article.featuredImage.url, alt: article.featuredImage.alt } : null
  );
  const [featuredUrlInput, setFeaturedUrlInput] = useState("");
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"featured" | "content">("featured");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);

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
      return;
    }
    insertImageMarkdown(item.url, item.alt ?? "");
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
      setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + prefix.length + snippet.length; }, 0);
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
    setUploadingFeatured(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const data = await res.json();
    setUploadingFeatured(false);
    if (res.ok) {
      setFeaturedImageId(data.media.id);
      setFeaturedImagePreview({ url: data.media.url, alt: data.media.alt });
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 10) { setError("शीर्षक कम से कम 10 अक्षर"); return; }
    setSaving(true);
    const payload = {
      title, slug: slug || slugify(title), excerpt, content, highlight, location, status,
      categoryId, authorId, tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      featured, breaking, trending, seoTitle, seoDescription,
      featuredImageId,
      scheduledAt: status === "SCHEDULED" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };
    const res = await fetch(article ? `/api/admin/articles/${article.id}` : "/api/admin/articles", {
      method: article ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) onSaved(); else { const d = await res.json(); setError(d.error ?? "सुरक्षित नहीं हो सका"); }
  }

  return (
    <form onSubmit={save}>
      <MediaPickerModal open={mediaPickerOpen} onClose={() => setMediaPickerOpen(false)} onSelect={handleMediaSelect} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={close} className="muted text-sm">← पोस्ट पर लौटें</button>
          <h1 className="text-2xl font-black">{article ? "पोस्ट संपादित करें" : "नई पोस्ट"}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={close} className="btn btn-ghost">रद्द</button>
          <button disabled={saving} className="btn btn-primary">{saving ? "सुरक्षित..." : "सुरक्षित करें"}</button>
        </div>
      </div>
      {error && <p className="mt-3 text-red-600">{error}</p>}
      <div className="mt-4"><StorageBanner storage={storage} /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_330px]">
        <div className="surface grid gap-5 rounded-xl p-5">
          <label className="font-bold">शीर्षक<input value={title} onChange={(e) => setTitle(e.target.value)} className="input mt-2" maxLength={160} /></label>
          <label className="font-bold">सारांश<textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="input mt-2 min-h-24" maxLength={280} /></label>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">मुख्य सामग्री</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={insertImageFromPrompt} className="btn btn-ghost text-xs"><ImageIcon size={14} /> चित्र जोड़ें</button>
                <button type="button" onClick={() => openMediaPicker("content")} className="btn btn-ghost text-xs"><ImageIcon size={14} /> लाइब्रेरी से</button>
              </div>
            </div>
            <p className="muted mt-1 text-xs">## शीर्षक, &gt; उद्धरण, ![alt](url) या ![alt|caption](url) चित्र</p>
            <textarea ref={bodyTextareaRef} value={body} onChange={(e) => setBody(e.target.value)} className="input mt-2 min-h-72 font-mono text-sm" />
          </div>
          <label className="font-bold">हाइलाइट<textarea value={highlight} onChange={(e) => setHighlight(e.target.value)} className="input mt-2 min-h-20" /></label>
        </div>
        <div className="grid content-start gap-5">
          <div className="surface grid gap-4 rounded-xl p-5">
            <h2 className="font-black">फीचर्ड चित्र</h2>
            {featuredImagePreview ? (
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <Image src={featuredImagePreview.url} alt={featuredImagePreview.alt ?? "Featured"} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900">
                <ImageIcon className="text-neutral-400" size={32} />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {storage?.configured && (
                <label className="btn btn-primary cursor-pointer text-xs">
                  {uploadingFeatured ? "अपलोड..." : "अपलोड"}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadFeatured} disabled={uploadingFeatured} />
                </label>
              )}
              <button type="button" onClick={() => openMediaPicker("featured")} className="btn btn-ghost text-xs">लाइब्रेरी</button>
              {featuredImagePreview && (
                <button type="button" onClick={() => { setFeaturedImageId(null); setFeaturedImagePreview(null); }} className="btn btn-ghost text-xs text-red-600">हटाएं</button>
              )}
            </div>
            <div className="flex gap-2">
              <input value={featuredUrlInput} onChange={(e) => setFeaturedUrlInput(e.target.value)} className="input flex-1 text-sm" placeholder="https://... चित्र URL" />
              <button type="button" onClick={setFeaturedFromUrl} className="btn btn-ghost text-xs whitespace-nowrap">URL सेट</button>
            </div>
            <p className="muted text-xs">पूर्ण मीडिया प्रबंधन के लिए साइडबार में <strong>मीडिया</strong> अनुभाग खोलें</p>
          </div>
          <div className="surface grid gap-4 rounded-xl p-5"><h2 className="font-black">प्रकाशन</h2>
            <label className="text-sm font-bold">स्थिति<select value={status} onChange={(e) => setStatus(e.target.value)} className="input mt-1">{Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s as keyof typeof STATUS_LABELS]}</option>)}</select></label>
            {status === "SCHEDULED" && <label className="text-sm font-bold">निर्धारित समय<input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="input mt-1" /></label>}
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={breaking} onChange={(e) => setBreaking(e.target.checked)} /> ब्रेकिंग</label>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> फीचर्ड</label>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={trending} onChange={(e) => setTrending(e.target.checked)} /> ट्रेंडिंग</label>
          </div>
          <div className="surface grid gap-4 rounded-xl p-5"><h2 className="font-black">वर्गीकरण और SEO</h2>
            <label className="text-sm font-bold">श्रेणी<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input mt-1">{meta.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="text-sm font-bold">लेखक<select value={authorId} onChange={(e) => setAuthorId(e.target.value)} className="input mt-1">{meta.authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
            <label className="text-sm font-bold">Slug<input value={slug} onChange={(e) => setSlug(e.target.value)} className="input mt-1" pattern="[a-z0-9-]+" /></label>
            <label className="text-sm font-bold">स्थान<input value={location} onChange={(e) => setLocation(e.target.value)} className="input mt-1" /></label>
            <label className="text-sm font-bold">Meta शीर्षक<input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="input mt-1" /></label>
            <label className="text-sm font-bold">Meta विवरण<textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="input mt-1" /></label>
            <label className="text-sm font-bold">टैग<input value={tags} onChange={(e) => setTags(e.target.value)} className="input mt-1" placeholder="हिसार, विकास" /></label>
          </div>
        </div>
      </div>
    </form>
  );
}

function MediaManager({ flash }: { flash: (s: string) => void }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);
  useEffect(() => { fetch("/api/admin/media").then((r) => r.json()).then((d) => { setMedia(d.media ?? []); setStorage(d.storage); }).catch(() => undefined); }, []);
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const form = new FormData(); form.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) { setMedia([data.media, ...media]); flash("अपलोड सफल"); } else flash(data.error ?? "अपलोड विफल — credentials जांचें");
    e.target.value = "";
  }
  async function addFromUrl() {
    if (!urlInput.trim()) return;
    setAddingUrl(true);
    const res = await fetch("/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlInput.trim() }),
    });
    const data = await res.json();
    setAddingUrl(false);
    if (res.ok) { setMedia([data.media, ...media]); setUrlInput(""); flash("URL जोड़ा गया"); }
    else flash(data.error ?? "URL जोड़ना विफल");
  }
  return <div>
    <div className="flex flex-wrap justify-between gap-3">
      <div><h1 className="text-2xl font-black">मीडिया लाइब्रेरी</h1><StorageBanner storage={storage} /></div>
      <div className="flex flex-wrap gap-2">
        {storage?.configured && (
          <label className="btn btn-primary cursor-pointer"><Plus /> अपलोड<input onChange={upload} type="file" accept="image/*" className="hidden" /></label>
        )}
      </div>
    </div>
    <div className="mt-4 flex gap-2">
      <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="input flex-1" placeholder="https://example.com/image.jpg — बाहरी URL जोड़ें" />
      <button type="button" disabled={addingUrl || !urlInput.trim()} onClick={addFromUrl} className="btn btn-primary whitespace-nowrap">{addingUrl ? "..." : "URL जोड़ें"}</button>
    </div>
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">{media.map((file) => <div className="surface overflow-hidden rounded-xl" key={file.id}><div className="relative aspect-square"><Image fill src={file.url} alt={file.alt ?? file.filename} className="object-cover" unoptimized /></div><p className="truncate p-3 text-xs font-bold">{file.filename}</p></div>)}</div>
  </div>;
}

function BreakingManager({ flash }: { flash: (s: string) => void }) {
  const [items, setItems] = useState<Array<{ id: string; title: string; enabled: boolean; sortOrder: number }>>([]);
  useEffect(() => { fetch("/api/admin/breaking").then((r) => r.json()).then((d) => setItems(d.items ?? [])); }, []);
  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/admin/breaking/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
    setItems(items.map((i) => i.id === id ? { ...i, enabled } : i)); flash("अपडेट");
  }
  return <div><h1 className="text-2xl font-black">ब्रेकिंग न्यूज़</h1><div className="surface mt-6 rounded-xl p-5">{items.map((item) => <div className="flex items-center justify-between gap-4 border-b py-4 last:border-0" style={{ borderColor: "var(--line)" }} key={item.id}><strong>{item.title}</strong><button onClick={() => toggle(item.id, !item.enabled)} className={`btn ${item.enabled ? "btn-primary" : "btn-ghost"} text-xs`}>{item.enabled ? "सक्रिय" : "निष्क्रिय"}</button></div>)}</div></div>;
}

function AuthorsPanel({ meta, flash }: { meta: Meta; flash: (s: string) => void }) {
  return <div><h1 className="text-2xl font-black">लेखक</h1><div className="surface mt-6 rounded-xl p-5">{meta.authors.map((a) => <div className="border-b py-3 last:border-0" style={{ borderColor: "var(--line)" }} key={a.id}><strong>{a.name}</strong></div>)}</div><button onClick={() => flash("लेखक DB में seed किए गए हैं")} className="btn btn-ghost mt-4 text-sm">नोट देखें</button></div>;
}

function CommentsPanel({ flash }: { flash: (s: string) => void }) {
  const [comments, setComments] = useState<Array<{ id: string; content: string; authorName: string; approved: boolean; article: { title: string } }>>([]);
  useEffect(() => { fetch("/api/admin/comments").then((r) => r.json()).then((d) => setComments(d.comments ?? [])); }, []);
  async function moderate(id: string, approved: boolean) {
    await fetch(`/api/admin/comments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved }) });
    setComments(comments.map((c) => c.id === id ? { ...c, approved } : c)); flash(approved ? "स्वीकृत" : "अस्वीकृत");
  }
  return <div><h1 className="text-2xl font-black">टिप्पणी मॉडरेशन</h1><div className="surface mt-6 rounded-xl p-5">{comments.map((c) => <div className="border-b py-4 last:border-0" style={{ borderColor: "var(--line)" }} key={c.id}><p className="font-bold">{c.authorName} — {c.article.title}</p><p className="mt-2">{c.content}</p><div className="mt-2 flex gap-2"><button onClick={() => moderate(c.id, true)} className="btn btn-primary text-xs">स्वीकृत</button><button onClick={() => moderate(c.id, false)} className="btn btn-ghost text-xs">अस्वीकृत</button></div></div>)}</div></div>;
}

function AdsPanel({ flash }: { flash: (s: string) => void }) {
  const [ads, setAds] = useState<Array<{ id: string; name: string; position: string; enabled: boolean }>>([]);
  useEffect(() => { fetch("/api/admin/ads").then((r) => r.json()).then((d) => setAds(d.ads ?? [])); }, []);
  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/admin/ads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
    setAds(ads.map((a) => a.id === id ? { ...a, enabled } : a)); flash("अपडेट");
  }
  return <div><h1 className="text-2xl font-black">विज्ञापन स्लॉट</h1><div className="surface mt-6 rounded-xl p-5">{ads.map((ad) => <div className="flex items-center justify-between gap-4 border-b py-4 last:border-0" style={{ borderColor: "var(--line)" }} key={ad.id}><div><strong>{ad.name}</strong><p className="muted text-xs">{AD_POSITION_LABELS[ad.position as keyof typeof AD_POSITION_LABELS] ?? ad.position}</p></div><button onClick={() => toggle(ad.id, !ad.enabled)} className={`btn ${ad.enabled ? "btn-primary" : "btn-ghost"} text-xs`}>{ad.enabled ? "सक्रिय" : "निष्क्रिय"}</button></div>)}</div></div>;
}

function SettingsPanel({ title, keys, flash }: { title: string; keys: string[]; flash: (s: string) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => { fetch("/api/admin/settings").then((r) => r.json()).then((d) => setValues(d.settings ?? {})); }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const settings: Record<string, string> = {};
    keys.forEach((k) => { settings[k] = values[k] ?? ""; });
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings }) });
    flash(res.ok ? "सुरक्षित" : "त्रुटि");
  }
  return <div><h1 className="text-2xl font-black">{title}</h1><form onSubmit={save} className="surface mt-6 max-w-2xl rounded-xl p-5"><div className="grid gap-5">{keys.map((key) => <label className="text-sm font-bold" key={key}>{key}<input className="input mt-2" value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} /></label>)}</div><button className="btn btn-primary mt-6">बदलाव सुरक्षित करें</button></form></div>;
}
