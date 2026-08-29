"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import {
  BLOG_STATUS_LABELS,
  blocksToEditorText,
  editorTextToBlocks,
  slugify,
  type ContentBlock,
} from "@/lib/types";
import { MediaPickerModal, StorageBanner } from "./shared";
import type { BlogRow, MediaItem, Meta, StorageStatus, User } from "./types";

export function BlogEditor({
  meta,
  blog,
  currentUser,
  close,
  onSaved,
}: {
  meta: Meta;
  blog: BlogRow | null;
  currentUser?: User | null;
  close: () => void;
  onSaved: (message?: string) => void;
}) {
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState(blog?.title ?? "");
  const [slug, setSlug] = useState(blog?.slug ?? "");
  const [excerpt, setExcerpt] = useState(blog?.excerpt ?? "");
  const [body, setBody] = useState(blocksToEditorText(blog?.content ?? [{ type: "paragraph", text: "" }]));
  const [status, setStatus] = useState(blog?.status ?? "DRAFT");
  const [authorName, setAuthorName] = useState(blog?.author.name ?? currentUser?.name ?? "");
  const [tags, setTags] = useState(blog?.tags.join(", ") ?? "");
  const [seoTitle, setSeoTitle] = useState(blog?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(blog?.seoDescription ?? "");
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(blog?.featuredImage?.id ?? null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<{ url: string; alt?: string | null } | null>(
    blog?.featuredImage ? { url: blog.featuredImage.url, alt: blog.featuredImage.alt } : null,
  );
  const [featuredImageAlt, setFeaturedImageAlt] = useState(blog?.featuredImage?.alt ?? "");
  const [featuredUrlInput, setFeaturedUrlInput] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"featured" | "content">("featured");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);

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
      status: nextStatus,
      authorName: authorName.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      seoTitle,
      seoDescription,
      featuredImageId,
    };
    const res = await fetch(blog ? `/api/admin/blogs/${blog.id}` : "/api/admin/blogs", {
      method: blog ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      const label = BLOG_STATUS_LABELS[nextStatus as keyof typeof BLOG_STATUS_LABELS] ?? nextStatus;
      const msg = nextStatus === "PUBLISHED" ? "ब्लॉग प्रकाशित" : `ड्राफ्ट सुरक्षित (${label})`;
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
      : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";

  return (
    <form onSubmit={(e) => save(e, false)}>
      <MediaPickerModal open={mediaPickerOpen} onClose={() => setMediaPickerOpen(false)} onSelect={handleMediaSelect} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={close} className="muted text-sm">
            ← ब्लॉग पर लौटें
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black">{blog ? "ब्लॉग संपादित करें" : "नया ब्लॉग"}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass}`}>
              {BLOG_STATUS_LABELS[status as keyof typeof BLOG_STATUS_LABELS] ?? status}
            </span>
          </div>
          {status === "DRAFT" && (
            <p className="muted mt-1 text-sm">ड्राफ्ट साइट पर नहीं दिखता — प्रकाशित करने के लिए &quot;प्रकाशित करें&quot; दबाएं।</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
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
          </div>
          <div className="surface grid gap-4 rounded-xl p-5">
            <h2 className="font-black">प्रकाशन</h2>
            <label className="text-sm font-bold">
              स्थिति
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="input mt-1">
                {Object.keys(BLOG_STATUS_LABELS).map((s) => (
                  <option key={s} value={s}>
                    {BLOG_STATUS_LABELS[s as keyof typeof BLOG_STATUS_LABELS]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="surface grid gap-4 rounded-xl p-5">
            <h2 className="font-black">लेखक और SEO</h2>
            <label className="text-sm font-bold">
              लेखक
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                list="blog-author-suggestions"
                className="input mt-1"
                placeholder="अपना नाम या लेखक का नाम लिखें"
                maxLength={80}
              />
              <datalist id="blog-author-suggestions">
                {meta.authors.map((a) => (
                  <option key={a.id} value={a.name} />
                ))}
              </datalist>
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
              टैग
              <input value={tags} onChange={(e) => setTags(e.target.value)} className="input mt-1" placeholder="राजनीति, विश्लेषण" />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
