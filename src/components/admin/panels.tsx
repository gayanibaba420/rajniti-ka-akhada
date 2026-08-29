"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { AD_POSITION_LABELS, STATUS_LABELS, slugify } from "@/lib/types";
import { HOMEPAGE_SECTION_KEYS } from "@/lib/homepage-settings";
import { ErrorBlock, LoadingBlock, PanelHeader, StorageBanner } from "./shared";
import type { AnalyticsSummary, ArticleRow } from "./types";

const SETTING_LABELS: Record<string, string> = {
  site_name: "वेबसाइट नाम",
  site_tagline: "टैगलाइन",
  site_description: "डिफ़ॉल्ट Meta विवरण",
  contact_email: "संपर्क ईमेल",
  contact_phone: "फ़ोन नंबर",
  site_logo: "लोगो URL",
  site_favicon: "Favicon URL",
  seo_keywords: "SEO कीवर्ड",
  gsc_verification: "Google Search Console सत्यापन",
  header_notice: "हेडर सूचना",
  social_facebook: "Facebook URL",
  social_instagram: "Instagram URL",
  social_youtube: "YouTube URL",
  homepage_featured_slug: "होमपेज मुख्य खबर (slug)",
};

const GENERAL_KEYS = ["site_name", "contact_email", "contact_phone", "site_logo", "site_favicon"];
const SOCIAL_KEYS = ["social_facebook", "social_instagram", "social_youtube"];
const SEO_KEYS = ["site_name", "site_description", "seo_keywords", "gsc_verification"];
const APPEARANCE_KEYS = ["site_logo", "site_favicon", "site_tagline", "header_notice"];
const HOMEPAGE_KEYS = ["homepage_featured_slug", ...HOMEPAGE_SECTION_KEYS.map((s) => s.key)];

const AD_SLOT_HINTS: Record<string, string> = {
  HEADER: "हेडर",
  HOMEPAGE: "होमपेज",
  ARTICLE_TOP: "लेख शीर्ष",
  ARTICLE_MIDDLE: "लेख मध्य",
  ARTICLE_BOTTOM: "लेख नीचे",
  SIDEBAR: "मोबाइल/साइडबार",
};

export function DashboardPanel({
  analytics,
  articles,
  create,
  openPosts,
}: {
  analytics: AnalyticsSummary | null;
  articles: ArticleRow[];
  create: () => void;
  openPosts: () => void;
}) {
  const counts = analytics?.postCounts;
  const views = analytics?.views;
  const todayNews = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return articles.filter((a) => a.publishedAt && new Date(a.publishedAt) >= today).length;
  }, [articles]);

  const stats = [
    ["कुल समाचार", counts?.total ?? articles.length],
    ["प्रकाशित", counts?.published ?? 0],
    ["ड्राफ्ट", counts?.draft ?? 0],
    ["आज के समाचार", todayNews],
    ["कुल व्यू", views?.total ?? 0],
  ] as const;

  return (
    <>
      <PanelHeader
        title="डैशबोर्ड"
        subtitle="समाचार पोर्टल का संक्षिप्त अवलोकन"
        action={
          <button onClick={create} className="btn btn-primary">
            <Plus size={18} /> समाचार जोड़ें
          </button>
        }
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map(([label, value]) => (
          <div className="surface rounded-xl p-5" key={label}>
            <p className="muted text-sm">{label}</p>
            <p className="mt-2 text-3xl font-black">{Number(value).toLocaleString("hi-IN")}</p>
          </div>
        ))}
      </div>
      <div className="surface mt-6 rounded-xl p-5">
        <div className="flex justify-between gap-3">
          <h2 className="font-black">हाल के समाचार</h2>
          <button onClick={openPosts} className="brand text-sm font-bold">
            सभी देखें
          </button>
        </div>
        <div className="mt-4 grid gap-1">
          {articles.slice(0, 8).map((a) => (
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b py-3 last:border-0" style={{ borderColor: "var(--line)" }} key={a.id}>
              <div>
                <p className="line-clamp-1 font-bold">{a.title}</p>
                <span className="muted text-xs">
                  {a.author.name} • {STATUS_LABELS[a.status as keyof typeof STATUS_LABELS] ?? a.status}
                </span>
              </div>
              <span className="text-xs font-bold text-green-600">{a.viewCount.toLocaleString("hi-IN")}</span>
            </div>
          ))}
          {!articles.length && <p className="muted py-4 text-center text-sm">अभी कोई समाचार नहीं</p>}
        </div>
      </div>
    </>
  );
}

export function PostsPanel({
  articles,
  edit,
  create,
  onRefresh,
  flash,
}: {
  articles: ArticleRow[];
  edit: (a: ArticleRow) => void;
  create: () => void;
  onRefresh: () => void;
  flash: (s: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = articles.filter((a) => {
    const matchText = !filter.trim() || a.title.toLowerCase().includes(filter.toLowerCase());
    const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchText && matchStatus;
  });

  async function updateStatus(article: ArticleRow, nextStatus: string) {
    const res = await fetch(`/api/admin/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        categoryId: article.category.id,
        authorId: article.author.id,
        content: article.content,
      }),
    });
    if (res.ok) {
      const label = STATUS_LABELS[nextStatus as keyof typeof STATUS_LABELS] ?? nextStatus;
      flash(nextStatus === "PUBLISHED" ? "प्रकाशित — साइट पर दिखेगा" : `स्थिति: ${label}`);
      onRefresh();
    } else {
      const data = await res.json().catch(() => ({}));
      flash(data.error ?? "त्रुटि");
    }
  }

  async function remove(article: ArticleRow) {
    if (!window.confirm(`"${article.title}" हटाएं?`)) return;
    const res = await fetch(`/api/admin/articles/${article.id}`, { method: "DELETE" });
    flash(res.ok ? "समाचार हटाया गया" : "हटाना विफल");
    if (res.ok) onRefresh();
  }

  return (
    <div>
      <PanelHeader
        title="समाचार"
        subtitle="जोड़ें, संपादित करें, प्रकाशित करें या हटाएं"
        action={
          <button onClick={create} className="btn btn-primary">
            <Plus size={18} /> नया समाचार
          </button>
        }
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} className="input max-w-sm" placeholder="शीर्षक खोजें..." />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input !w-auto">
          <option value="ALL">सभी स्थिति</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="surface mt-6 overflow-x-auto rounded-xl">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              {["शीर्षक", "श्रेणी", "लेखक", "स्थिति", "व्यू", "कार्रवाई"].map((h) => (
                <th className="p-4" key={h}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr className="border-t" style={{ borderColor: "var(--line)" }} key={a.id}>
                <td className="max-w-sm p-4 font-bold">{a.title}</td>
                <td className="p-4">{a.category.name}</td>
                <td className="p-4">{a.author.name}</td>
                <td className="p-4">
                  <select value={a.status} onChange={(e) => updateStatus(a, e.target.value)} className="input !w-auto !py-1">
                    {Object.keys(STATUS_LABELS).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s as keyof typeof STATUS_LABELS]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-4">{a.viewCount}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => edit(a)} className="brand font-bold">
                      संपादित
                    </button>
                    <button onClick={() => remove(a)} className="text-red-600 font-bold">
                      हटाएं
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="muted p-6 text-center text-sm">कोई समाचार नहीं मिला</p>}
      </div>
    </div>
  );
}

export function MediaPanel({ flash }: { flash: (s: string) => void }) {
  const [media, setMedia] = useState<Array<{ id: string; url: string; filename: string; alt?: string | null }>>([]);
  const [storage, setStorage] = useState<{ provider: string; configured: boolean; message?: string } | null>(null);
  const [search, setSearch] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/media");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "लोड विफल");
      setMedia(d.media ?? []);
      setStorage(d.storage ?? null);
    } catch {
      setError("मीडिया लोड नहीं हो सका");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) {
      setMedia([data.media, ...media]);
      flash("अपलोड सफल");
    } else flash(data.error ?? "अपलोड विफल");
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
    if (res.ok) {
      setMedia([data.media, ...media]);
      setUrlInput("");
      flash("URL जोड़ा गया");
    } else flash(data.error ?? "URL जोड़ना विफल");
  }

  async function remove(id: string) {
    if (!window.confirm("यह चित्र हटाएं?")) return;
    const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMedia((m) => m.filter((x) => x.id !== id));
      flash("मीडिया हटाया गया");
    } else flash("हटाना विफल");
  }

  const filtered = media.filter(
    (m) =>
      !search.trim() ||
      m.filename.toLowerCase().includes(search.toLowerCase()) ||
      (m.alt ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PanelHeader title="मीडिया" subtitle="चित्र अपलोड, खोज और पुन: उपयोग" />
      <div className="mt-4">
        <StorageBanner storage={storage} />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input max-w-sm" placeholder="खोजें..." />
        {storage?.configured && (
          <label className="btn btn-primary cursor-pointer">
            <Plus size={16} /> अपलोड
            <input onChange={upload} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" />
          </label>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="input flex-1" placeholder="https://example.com/image.jpg" />
        <button type="button" disabled={addingUrl || !urlInput.trim()} onClick={addFromUrl} className="btn btn-primary whitespace-nowrap">
          {addingUrl ? "..." : "URL जोड़ें"}
        </button>
      </div>
      {loading ? (
        <div className="mt-6">
          <LoadingBlock />
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorBlock message={error} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((file) => (
            <div className="surface overflow-hidden rounded-xl" key={file.id}>
              <div className="relative aspect-square">
                <Image fill src={file.url} alt={file.alt ?? file.filename} className="object-cover" unoptimized />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <p className="truncate text-xs font-bold">{file.filename}</p>
                <button onClick={() => remove(file.id)} className="text-red-600" aria-label="हटाएं">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {!filtered.length && <p className="col-span-full muted py-6 text-center text-sm">कोई मीडिया नहीं</p>}
        </div>
      )}
    </div>
  );
}

export function CategoriesPanel({ flash, onMetaRefresh }: { flash: (s: string) => void; onMetaRefresh: () => void }) {
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; _count?: { articles: number } }>>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    const d = await res.json();
    setCategories(d.categories ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = { name: name.trim(), slug: slug.trim() || slugify(name) };
    const res = await fetch(editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      flash(editingId ? "श्रेणी अपडेट" : "श्रेणी जोड़ी गई");
      setName("");
      setSlug("");
      setEditingId(null);
      load();
      onMetaRefresh();
    } else {
      const d = await res.json().catch(() => ({}));
      flash(d.error ?? "त्रुटि");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("यह श्रेणी हटाएं?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    flash(res.ok ? "श्रेणी हटाई गई" : "हटाना विफल — पहले समाचार हटाएं");
    if (res.ok) {
      load();
      onMetaRefresh();
    }
  }

  function startEdit(c: { id: string; name: string; slug: string }) {
    setEditingId(c.id);
    setName(c.name);
    setSlug(c.slug);
  }

  return (
    <div>
      <PanelHeader title="श्रेणियाँ" subtitle="समाचार श्रेणियाँ प्रबंधित करें" />
      <form onSubmit={save} className="surface mt-6 grid max-w-xl gap-4 rounded-xl p-5 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm font-bold">
          नाम
          <input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" required />
        </label>
        <label className="text-sm font-bold">
          Slug
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input mt-1" placeholder="auto-slug" pattern="[a-z0-9-]*" />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn btn-primary">
            {editingId ? "अपडेट" : "जोड़ें"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setName("");
                setSlug("");
              }}
              className="btn btn-ghost"
            >
              रद्द
            </button>
          )}
        </div>
      </form>
      {loading ? (
        <div className="mt-6">
          <LoadingBlock />
        </div>
      ) : (
        <div className="surface mt-6 overflow-x-auto rounded-xl">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                {["नाम", "Slug", "समाचार", "कार्रवाई"].map((h) => (
                  <th className="p-4" key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr className="border-t" style={{ borderColor: "var(--line)" }} key={c.id}>
                  <td className="p-4 font-bold">{c.name}</td>
                  <td className="p-4">{c.slug}</td>
                  <td className="p-4">{c._count?.articles ?? 0}</td>
                  <td className="p-4">
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(c)} className="brand font-bold">
                        संपादित
                      </button>
                      <button onClick={() => remove(c.id)} className="text-red-600 font-bold">
                        हटाएं
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type BreakingItem = {
  id: string;
  title: string;
  enabled: boolean;
  sortOrder: number;
  link?: string | null;
  startsAt?: string | null;
  expiresAt?: string | null;
};

export function BreakingPanel({ flash }: { flash: (s: string) => void }) {
  const [items, setItems] = useState<BreakingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [enabled, setEnabled] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/breaking");
    const d = await res.json();
    setItems(d.items ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/admin/breaking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        link: link.trim() || undefined,
        enabled,
        sortOrder: items.length,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    });
    if (res.ok) {
      flash("ब्रेकिंग समाचार जोड़ा गया");
      setTitle("");
      setLink("");
      setStartsAt("");
      setExpiresAt("");
      setEnabled(true);
      load();
    } else flash("जोड़ना विफल");
  }

  async function patchItem(id: string, data: Partial<BreakingItem> & { startsAt?: string | null; expiresAt?: string | null }) {
    const payload = {
      ...data,
      startsAt: data.startsAt === undefined ? undefined : data.startsAt ? new Date(data.startsAt).toISOString() : null,
      expiresAt: data.expiresAt === undefined ? undefined : data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
    };
    await fetch(`/api/admin/breaking/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    load();
    flash("अपडेट");
  }

  async function remove(id: string) {
    if (!window.confirm("हटाएं?")) return;
    await fetch(`/api/admin/breaking/${id}`, { method: "DELETE" });
    load();
    flash("हटाया गया");
  }

  return (
    <div>
      <PanelHeader title="ब्रेकिंग" subtitle="हेडलाइन ON/OFF, समय सीमा और स्वतः समाप्ति" />
      <form onSubmit={addItem} className="surface mt-6 grid gap-4 rounded-xl p-5 md:grid-cols-2">
        <label className="text-sm font-bold md:col-span-2">
          हेडलाइन
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input mt-1" required />
        </label>
        <label className="text-sm font-bold">
          लिंक (वैकल्पिक)
          <input value={link} onChange={(e) => setLink(e.target.value)} className="input mt-1" placeholder="/article/..." />
        </label>
        <label className="flex items-center gap-2 self-end text-sm font-bold">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> सक्रिय
        </label>
        <label className="text-sm font-bold">
          प्रारंभ समय
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="input mt-1" />
        </label>
        <label className="text-sm font-bold">
          समाप्ति समय (स्वतः OFF)
          <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="input mt-1" />
        </label>
        <button type="submit" className="btn btn-primary md:col-span-2 md:w-fit">
          <Plus size={16} /> जोड़ें
        </button>
      </form>
      {loading ? (
        <div className="mt-6">
          <LoadingBlock />
        </div>
      ) : (
        <div className="surface mt-6 rounded-xl p-5">
          {items.map((item) => {
            const expired = item.expiresAt && new Date(item.expiresAt) <= new Date();
            return (
              <div className="grid gap-3 border-b py-4 last:border-0 md:grid-cols-[1fr_auto]" style={{ borderColor: "var(--line)" }} key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p className="muted mt-1 text-xs">
                    {item.startsAt ? `प्रारंभ: ${new Date(item.startsAt).toLocaleString("hi-IN")}` : "तुरंत"}
                    {" • "}
                    {item.expiresAt ? `समाप्ति: ${new Date(item.expiresAt).toLocaleString("hi-IN")}` : "कोई समाप्ति नहीं"}
                    {expired && " • समाप्त"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => patchItem(item.id, { enabled: !item.enabled })} className={`btn ${item.enabled && !expired ? "btn-primary" : "btn-ghost"} text-xs`}>
                    {item.enabled && !expired ? "ON" : "OFF"}
                  </button>
                  <button
                    onClick={() => {
                      const next = window.prompt("हेडलाइन संपादित करें", item.title);
                      if (next?.trim()) patchItem(item.id, { title: next.trim() });
                    }}
                    className="btn btn-ghost text-xs"
                  >
                    संपादित
                  </button>
                  <button onClick={() => remove(item.id)} className="btn btn-ghost text-xs text-red-600">
                    हटाएं
                  </button>
                </div>
              </div>
            );
          })}
          {!items.length && <p className="muted py-4 text-center text-sm">कोई ब्रेकिंग समाचार नहीं</p>}
        </div>
      )}
    </div>
  );
}

export function CommentsPanel({ flash }: { flash: (s: string) => void }) {
  const [comments, setComments] = useState<Array<{ id: string; content: string; authorName: string; approved: boolean; article: { title: string } }>>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/comments")
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = comments.filter((c) => {
    if (filter === "PENDING") return !c.approved;
    if (filter === "APPROVED") return c.approved;
    return true;
  });

  async function moderate(id: string, approved: boolean) {
    await fetch(`/api/admin/comments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved }) });
    setComments(comments.map((c) => (c.id === id ? { ...c, approved } : c)));
    flash(approved ? "स्वीकृत" : "अस्वीकृत");
  }

  async function remove(id: string) {
    await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    setComments(comments.filter((c) => c.id !== id));
    flash("टिप्पणी हटाई गई");
  }

  return (
    <div>
      <PanelHeader title="टिप्पणियाँ" subtitle="लंबित, स्वीकृत, स्पैम और हटाएं" />
      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["ALL", "सभी"],
            ["PENDING", "लंबित"],
            ["APPROVED", "स्वीकृत"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`btn text-xs ${filter === k ? "btn-primary" : "btn-ghost"}`}>
            {label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="mt-6">
          <LoadingBlock />
        </div>
      ) : (
        <div className="surface mt-6 rounded-xl p-5">
          {filtered.map((c) => (
            <div className="border-b py-4 last:border-0" style={{ borderColor: "var(--line)" }} key={c.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">
                  {c.authorName} — {c.article.title}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.approved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>
                  {c.approved ? "स्वीकृत" : "लंबित"}
                </span>
              </div>
              <p className="mt-2">{c.content}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {!c.approved && (
                  <button onClick={() => moderate(c.id, true)} className="btn btn-primary text-xs">
                    स्वीकृत
                  </button>
                )}
                {c.approved && (
                  <button onClick={() => moderate(c.id, false)} className="btn btn-ghost text-xs">
                    अस्वीकृत
                  </button>
                )}
                <button onClick={() => remove(c.id)} className="btn btn-ghost text-xs text-red-600">
                  हटाएं / स्पैम
                </button>
              </div>
            </div>
          ))}
          {!filtered.length && <p className="muted py-4 text-center text-sm">कोई टिप्पणी नहीं</p>}
        </div>
      )}
    </div>
  );
}

type AdRow = { id: string; name: string; position: string; enabled: boolean; code?: string };

export function AdsPanel({ flash }: { flash: (s: string) => void }) {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [codeDraft, setCodeDraft] = useState("");

  useEffect(() => {
    fetch("/api/admin/ads")
      .then((r) => r.json())
      .then((d) => setAds(d.ads ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/admin/ads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
    setAds(ads.map((a) => (a.id === id ? { ...a, enabled } : a)));
    flash("अपडेट");
  }

  async function saveCode(id: string) {
    await fetch(`/api/admin/ads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: codeDraft }) });
    setAds(ads.map((a) => (a.id === id ? { ...a, code: codeDraft } : a)));
    setEditing(null);
    flash("विज्ञापन कोड सुरक्षित");
  }

  return (
    <div>
      <PanelHeader title="विज्ञापन" subtitle="हेडर, होमपेज, लेख और मोबाइल स्लॉट" />
      {loading ? (
        <div className="mt-6">
          <LoadingBlock />
        </div>
      ) : (
        <div className="surface mt-6 grid gap-4 rounded-xl p-5">
          {ads.map((ad) => (
            <div className="grid gap-3 border-b pb-5 last:border-0" style={{ borderColor: "var(--line)" }} key={ad.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <strong>{ad.name}</strong>
                  <p className="muted text-xs">
                    {AD_POSITION_LABELS[ad.position as keyof typeof AD_POSITION_LABELS] ?? ad.position}
                    {AD_SLOT_HINTS[ad.position] ? ` • ${AD_SLOT_HINTS[ad.position]}` : ""}
                  </p>
                </div>
                <button onClick={() => toggle(ad.id, !ad.enabled)} className={`btn ${ad.enabled ? "btn-primary" : "btn-ghost"} text-xs`}>
                  {ad.enabled ? "ON" : "OFF"}
                </button>
              </div>
              {editing === ad.id ? (
                <div className="grid gap-2">
                  <textarea value={codeDraft} onChange={(e) => setCodeDraft(e.target.value)} className="input min-h-24 font-mono text-xs" placeholder="HTML/AdSense कोड..." />
                  <div className="flex gap-2">
                    <button onClick={() => saveCode(ad.id)} className="btn btn-primary text-xs">
                      सुरक्षित
                    </button>
                    <button onClick={() => setEditing(null)} className="btn btn-ghost text-xs">
                      रद्द
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditing(ad.id);
                    setCodeDraft(ad.code ?? "");
                  }}
                  className="btn btn-ghost w-fit text-xs"
                >
                  विज्ञापन कोड {ad.code ? "संपादित" : "जोड़ें"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type SettingsTab = "general" | "seo" | "appearance" | "homepage" | "security";

function ChangePasswordForm({ flash }: { flash: (s: string) => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("नया पासवर्ड कम से कम 8 अक्षर");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("पासवर्ड मेल नहीं खाते");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      flash(data.message ?? "पासवर्ड बदल दिया गया");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(data.error ?? "पासवर्ड बदलना विफल");
    }
  }

  return (
    <form onSubmit={submit} className="grid max-w-md gap-4">
      <label className="text-sm font-bold">
        वर्तमान पासवर्ड
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input mt-2" required autoComplete="current-password" />
      </label>
      <label className="text-sm font-bold">
        नया पासवर्ड
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input mt-2" required minLength={8} autoComplete="new-password" />
      </label>
      <label className="text-sm font-bold">
        नया पासवर्ड (पुष्टि)
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input mt-2" required minLength={8} autoComplete="new-password" />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="btn btn-primary w-fit">
        {saving ? "बदल रहे हैं..." : "पासवर्ड बदलें"}
      </button>
    </form>
  );
}

export function SettingsPanelUnified({ flash }: { flash: (s: string) => void }) {
  const [tab, setTab] = useState<SettingsTab>("general");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishedArticles, setPublishedArticles] = useState<Array<{ slug: string; title: string }>>([]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setValues(d.settings ?? {}))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "homepage") return;
    fetch("/api/admin/articles?status=PUBLISHED&limit=100")
      .then((r) => r.json())
      .then((d) => setPublishedArticles((d.articles ?? []).map((a: { slug: string; title: string }) => ({ slug: a.slug, title: a.title }))))
      .catch(() => undefined);
  }, [tab]);

  const tabKeys: Record<Exclude<SettingsTab, "security">, string[]> = {
    general: [...GENERAL_KEYS, ...SOCIAL_KEYS],
    seo: SEO_KEYS,
    appearance: APPEARANCE_KEYS,
    homepage: HOMEPAGE_KEYS,
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const keys = [...new Set([...Object.values(tabKeys).flat(), ...HOMEPAGE_SECTION_KEYS.map((s) => s.key)])];
    const settings: Record<string, string> = {};
    keys.forEach((k) => {
      settings[k] = values[k] ?? "";
    });
    HOMEPAGE_SECTION_KEYS.forEach(({ key }) => {
      settings[key] = values[key] === "0" ? "0" : "1";
    });
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    setSaving(false);
    flash(res.ok ? "सेटिंग्स सुरक्षित" : "त्रुटि");
  }

  function toggleHomepageSection(key: string) {
    setValues((prev) => ({ ...prev, [key]: prev[key] === "0" ? "1" : "0" }));
  }

  const tabs: Array<[SettingsTab, string]> = [
    ["general", "सामान्य"],
    ["seo", "SEO"],
    ["appearance", "दिखावट"],
    ["homepage", "होमपेज"],
    ["security", "सुरक्षा"],
  ];

  return (
    <div>
      <PanelHeader title="सेटिंग्स" subtitle="वेबसाइट, SEO, होमपेज और सुरक्षा" />
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`btn text-sm ${tab === id ? "btn-primary" : "btn-ghost"}`}>
            {label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="mt-6">
          <LoadingBlock />
        </div>
      ) : tab === "security" ? (
        <div className="surface mt-6 max-w-2xl rounded-xl p-5">
          <h2 className="font-black">पासवर्ड बदलें</h2>
          <p className="muted mt-1 text-sm">अपने एडमिन खाते का पासवर्ड अपडेट करें।</p>
          <div className="mt-5">
            <ChangePasswordForm flash={flash} />
          </div>
        </div>
      ) : (
        <form onSubmit={save} className="surface mt-6 max-w-2xl rounded-xl p-5">
          <div className="grid gap-5">
            {tab === "homepage" && (
              <>
                <label className="text-sm font-bold">
                  मुख्य फीचर्ड खबर
                  <select
                    value={values.homepage_featured_slug ?? ""}
                    onChange={(e) => setValues({ ...values, homepage_featured_slug: e.target.value })}
                    className="input mt-2"
                  >
                    <option value="">स्वचालित (फीचर्ड → नवीनतम)</option>
                    {publishedArticles.map((a) => (
                      <option key={a.slug} value={a.slug}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                  <span className="muted mt-1 block text-xs">खाली छोड़ने पर पहली फीचर्ड या नवीनतम प्रकाशित खबर दिखेगी।</span>
                </label>
                <div>
                  <h3 className="font-black">होमपेज सेक्शन ON/OFF</h3>
                  <div className="mt-3 grid gap-2">
                    {HOMEPAGE_SECTION_KEYS.map(({ key, label }) => {
                      const enabled = values[key] !== "0";
                      return (
                        <div className="flex items-center justify-between gap-3 rounded-lg border p-3" style={{ borderColor: "var(--line)" }} key={key}>
                          <span className="text-sm font-bold">{label}</span>
                          <button type="button" onClick={() => toggleHomepageSection(key)} className={`btn text-xs ${enabled ? "btn-primary" : "btn-ghost"}`}>
                            {enabled ? "ON" : "OFF"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            {tabKeys[tab]
              .filter((key) => !HOMEPAGE_SECTION_KEYS.some((s) => s.key === key))
              .map((key) => (
                <label className="text-sm font-bold" key={key}>
                  {SETTING_LABELS[key] ?? key}
                  {key.includes("description") || key === "header_notice" ? (
                    <textarea value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} className="input mt-2 min-h-20" />
                  ) : (
                    <input className="input mt-2" value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} />
                  )}
                </label>
              ))}
            {tab === "seo" && (
              <div className="rounded-lg border p-4 text-sm" style={{ borderColor: "var(--line)" }}>
                <strong>Sitemap स्थिति</strong>
                <p className="muted mt-1">साइटमैप सक्रिय: /sitemap.xml • robots.txt में शामिल</p>
              </div>
            )}
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary mt-6">
            {saving ? "सुरक्षित..." : "बदलाव सुरक्षित करें"}
          </button>
        </form>
      )}
    </div>
  );
}
