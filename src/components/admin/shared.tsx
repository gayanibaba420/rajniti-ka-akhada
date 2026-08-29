"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon, X } from "lucide-react";
import type { MediaItem, StorageStatus } from "./types";

export function StorageBanner({ storage }: { storage: StorageStatus | null }) {
  if (!storage || storage.configured) return null;
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <strong>स्टोरेज कॉन्फ़िग नहीं ({storage.provider})</strong>
      <p className="mt-1">{storage.message}</p>
      <p className="mt-1">फ़ाइल अपलोड के लिए Vercel में STORAGE_PROVIDER=cloudinary सेट करें, या बाहरी URL उपयोग करें।</p>
    </div>
  );
}

export function LoadingBlock({ label = "लोड हो रहा है..." }: { label?: string }) {
  return (
    <div className="surface grid min-h-[200px] place-items-center rounded-xl p-8">
      <p className="muted animate-pulse text-sm font-bold">{label}</p>
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="surface rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
      <p className="text-red-600 dark:text-red-400">{message}</p>
    </div>
  );
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [search, setSearch] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => {
        setMedia(d.media ?? []);
        setStorage(d.storage ?? null);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
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

  const filtered = media.filter(
    (m) =>
      !search.trim() ||
      m.filename.toLowerCase().includes(search.toLowerCase()) ||
      (m.alt ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="surface max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">मीडिया लाइब्रेरी से चुनें</h2>
          <button type="button" onClick={onClose} className="btn btn-ghost !p-2" aria-label="बंद करें">
            <X size={18} />
          </button>
        </div>
        <StorageBanner storage={storage} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input mt-4"
          placeholder="खोजें..."
        />
        <div className="mt-4 flex gap-2">
          <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="input flex-1" placeholder="https://example.com/image.jpg" />
          <button type="button" disabled={adding || !urlInput.trim()} onClick={addFromUrl} className="btn btn-primary whitespace-nowrap">
            {adding ? "..." : "URL जोड़ें"}
          </button>
        </div>
        {loading ? (
          <LoadingBlock />
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {filtered.map((file) => (
              <button
                type="button"
                key={file.id}
                onClick={() => {
                  onSelect(file);
                  onClose();
                }}
                className="surface overflow-hidden rounded-lg text-left ring-2 ring-transparent hover:ring-[var(--brand)]"
              >
                <div className="relative aspect-square">
                  <Image fill src={file.url} alt={file.alt ?? file.filename} className="object-cover" unoptimized />
                </div>
                <p className="truncate p-2 text-xs font-bold">{file.filename}</p>
              </button>
            ))}
            {!filtered.length && (
              <p className="col-span-full muted py-6 text-center text-sm">
                {search ? "कोई परिणाम नहीं" : "कोई मीडिया नहीं — URL जोड़ें या मीडिया अनुभाग में अपलोड करें"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black">{title}</h1>
        {subtitle && <p className="muted mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
