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
} from "lucide-react";
import { AI_RADAR_STATUS_LABELS, AI_RADAR_VERIFICATION_LABELS, type AiRadarSettings } from "@/lib/ai-radar/types";
import { LoadingBlock, MediaPickerModal, PanelHeader } from "./shared";
import type { MediaItem } from "./types";

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

function statusBadgeClass(status: string): string {
  switch (status) {
    case "FETCHED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
    case "DRAFT":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200";
    case "NEEDS_VERIFICATION":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
    case "PUBLISHED":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";
    case "REJECTED":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

function confidenceColor(score: number | null): string {
  if (score == null) return "text-neutral-400";
  if (score >= 0.8) return "text-green-600";
  if (score >= 0.6) return "text-amber-600";
  return "text-red-600";
}

export function AiRadarPanel({ flash }: { flash: (s: string) => void }) {
  const [tab, setTab] = useState<"dashboard" | "settings">("dashboard");
  const [drafts, setDrafts] = useState<AiDraftRow[]>([]);
  const [stats, setStats] = useState<AiStats | null>(null);
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [settings, setSettings] = useState<AiRadarSettings | null>(null);
  const [apiKeys, setApiKeys] = useState<{ geminiConfigured: boolean; gnewsConfigured: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<AiDraftRow | null>(null);
  const [editDraft, setEditDraft] = useState<AiDraftRow | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return drafts.filter((d) => filter === "ALL" || d.status === filter);
  }, [drafts, filter]);

  async function fetchNews() {
    setBusy("fetch");
    const res = await fetch("/api/admin/ai-radar/fetch", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    flash(res.ok ? (data.message ?? "खबरें प्राप्त") : (data.error ?? "त्रुटि"));
    if (res.ok) void load();
  }

  async function generateDrafts(draftId?: string) {
    setBusy(draftId ?? "generate");
    const res = await fetch("/api/admin/ai-radar/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftId ? { draftId } : {}),
    });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    flash(res.ok ? (data.message ?? "ड्राफ्ट तैयार") : (data.error ?? "त्रुटि"));
    if (res.ok) void load();
  }

  async function bulkAction(action: "approve" | "reject" | "delete") {
    const ids = [...selected];
    if (!ids.length) return;
    if (action === "delete" && !window.confirm(`${ids.length} आइटम हटाएं?`)) return;
    setBusy(action);
    const res = await fetch("/api/admin/ai-radar/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    flash(res.ok ? (data.message ?? "अपडेट") : (data.error ?? "त्रुटि"));
    if (res.ok) {
      setSelected(new Set());
      void load();
    }
  }

  async function saveDraft() {
    if (!editDraft) return;
    setBusy("save");
    const res = await fetch(`/api/admin/ai-radar/${editDraft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editDraft.title,
        slug: editDraft.slug,
        content: editDraft.content,
        summary: editDraft.summary,
        metaTitle: editDraft.metaTitle,
        metaDescription: editDraft.metaDescription,
        category: editDraft.category,
        tags: editDraft.tags,
        imagePrompt: editDraft.imagePrompt,
        status: editDraft.status,
        featuredImageId: editDraft.featuredImage?.id ?? null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    flash(res.ok ? "ड्राफ्ट सुरक्षित" : (data.error ?? "त्रुटि"));
    if (res.ok) {
      setEditDraft(null);
      void load();
    }
  }

  async function publishDraft(draft: AiDraftRow) {
    if (
      !window.confirm(
        "AI जनित सामग्री — कृपया प्रकाशित करने से पहले तथ्यों की पुष्टि करें।\n\nक्या आप जारी रखना चाहते हैं?",
      )
    ) {
      return;
    }
    setBusy(`publish-${draft.id}`);
    const res = await fetch(`/api/admin/ai-radar/${draft.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirmAiWarning: true,
        featuredImageId: draft.featuredImage?.id ?? null,
        authorName: "AI News Desk",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    flash(res.ok ? (data.message ?? "प्रकाशित") : (data.error ?? "प्रकाशन विफल"));
    if (res.ok) {
      setPreview(null);
      setEditDraft(null);
      void load();
    }
  }

  async function saveSettings() {
    if (!settings) return;
    setBusy("settings");
    const res = await fetch("/api/admin/ai-radar/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    flash(res.ok ? "सेटिंग्स सुरक्षित" : (data.error ?? "त्रुटि"));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const statCards = stats
    ? [
        ["नई खबरें", stats.fetched],
        ["AI ड्राफ्ट", stats.draft],
        ["सत्यापन आवश्यक", stats.needsVerification],
        ["स्वीकृत", stats.approved],
        ["प्रकाशित", stats.published],
        ["अस्वीकृत", stats.rejected],
      ]
    : [];

  if (loading && !drafts.length) {
    return <LoadingBlock label="AI News Radar लोड हो रहा है..." />;
  }

  return (
    <div className="ai-radar-theme">
      <PanelHeader
        title="AI News Radar"
        subtitle="सुरक्षित AI समाचार — मैन्युअल अनुमोदन के साथ हिंदी ड्राफ्ट"
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void load()} className="btn btn-ghost" disabled={!!busy}>
              <RefreshCw size={16} className={busy ? "animate-spin" : ""} /> रिफ्रेश
            </button>
            <button onClick={() => void fetchNews()} className="btn btn-ghost" disabled={!!busy}>
              {busy === "fetch" ? <Loader2 size={16} className="animate-spin" /> : <Radar size={16} />}
              खबरें लाएं
            </button>
            <button onClick={() => void generateDrafts()} className="btn btn-primary !bg-indigo-700 hover:!bg-indigo-800" disabled={!!busy}>
              {busy === "generate" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              AI ड्राफ्ट बनाएं
            </button>
          </div>
        }
      />

      {apiKeys && (!apiKeys.geminiConfigured || !apiKeys.gnewsConfigured) && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          <strong className="flex items-center gap-2">
            <AlertTriangle size={16} /> API कुंजी सेटअप
          </strong>
          <p className="mt-1">
            {!apiKeys.geminiConfigured && "GEMINI_API_KEY "}
            {!apiKeys.gnewsConfigured && "GNEWS_API_KEY "}
            — सर्वर env vars में सेट करें (कभी भी frontend में नहीं)।
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2 border-b pb-2" style={{ borderColor: "var(--line)" }}>
        {(["dashboard", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === t ? "bg-indigo-700 text-white" : "hover:bg-indigo-50 dark:hover:bg-indigo-950/30"}`}
          >
            {t === "dashboard" ? "डैशबोर्ड" : "सेटिंग्स"}
          </button>
        ))}
      </div>

      {tab === "settings" && settings ? (
        <div className="surface mt-6 max-w-2xl rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Settings2 size={20} /> AI Radar सेटिंग्स
          </h2>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-1 text-sm">
              <span className="font-bold">AI Provider</span>
              <input className="input" value="Gemini (server-side)" disabled />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-bold">समाचार स्रोत</span>
              <select
                className="input"
                value={settings.newsSource}
                onChange={(e) => setSettings({ ...settings, newsSource: e.target.value as "gnews" | "rss" })}
              >
                <option value="gnews">GNews API</option>
                <option value="rss">RSS Feeds</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-bold">प्रति fetch अधिकतम लेख</span>
              <input
                type="number"
                className="input"
                min={1}
                max={25}
                value={settings.maxArticlesPerFetch}
                onChange={(e) => setSettings({ ...settings, maxArticlesPerFetch: Number(e.target.value) })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-bold">Auto-fetch अंतराल (मिनट)</span>
              <input
                type="number"
                className="input"
                min={15}
                max={360}
                value={settings.autoFetchIntervalMinutes}
                onChange={(e) => setSettings({ ...settings, autoFetchIntervalMinutes: Number(e.target.value) })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-bold">न्यूनतम AI विश्वास (0–1)</span>
              <input
                type="number"
                className="input"
                min={0}
                max={1}
                step={0.05}
                value={settings.minAiConfidence}
                onChange={(e) => setSettings({ ...settings, minAiConfidence: Number(e.target.value) })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={settings.duplicateDetection}
                onChange={(e) => setSettings({ ...settings, duplicateDetection: e.target.checked })}
              />
              डुप्लिकेट पहचान
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={settings.requireManualApproval}
                onChange={(e) => setSettings({ ...settings, requireManualApproval: e.target.checked })}
              />
              मैन्युअल अनुमोदन आवश्यक (डिफ़ॉल्ट ON)
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} />
              AI Radar सक्षम
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-bold">श्रेणियाँ (अल्पविराम से अलग)</span>
              <textarea
                className="input min-h-[80px]"
                value={settings.categories.join(", ")}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    categories: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <button onClick={() => void saveSettings()} className="btn btn-primary !bg-indigo-700" disabled={busy === "settings"}>
              {busy === "settings" ? "..." : "सेटिंग्स सुरक्षित करें"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {statCards.map(([label, value]) => (
              <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 dark:border-indigo-900 dark:from-indigo-950/40 dark:to-transparent" key={label}>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">{label}</p>
                <p className="mt-2 text-3xl font-black text-indigo-900 dark:text-indigo-100">{Number(value).toLocaleString("hi-IN")}</p>
              </div>
            ))}
          </div>

          <div className="surface mt-6 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="ALL">सभी स्थिति</option>
                {Object.entries(AI_RADAR_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              {selected.size > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => void bulkAction("approve")} className="btn btn-ghost text-sm" disabled={!!busy}>
                    <CheckCircle2 size={14} /> स्वीकृत ({selected.size})
                  </button>
                  <button onClick={() => void bulkAction("reject")} className="btn btn-ghost text-sm" disabled={!!busy}>
                    <XCircle size={14} /> अस्वीकृत
                  </button>
                  <button onClick={() => void bulkAction("delete")} className="btn btn-ghost text-sm text-red-600" disabled={!!busy}>
                    <Trash2 size={14} /> हटाएं
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-neutral-500" style={{ borderColor: "var(--line)" }}>
                    <th className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && filtered.every((d) => selected.has(d.id))}
                        onChange={() => {
                          if (filtered.every((d) => selected.has(d.id))) {
                            setSelected(new Set());
                          } else {
                            setSelected(new Set(filtered.map((d) => d.id)));
                          }
                        }}
                      />
                    </th>
                    <th className="py-2">खबर</th>
                    <th className="py-2">श्रेणी</th>
                    <th className="py-2">स्रोत</th>
                    <th className="py-2">AI</th>
                    <th className="py-2">स्थिति</th>
                    <th className="py-2">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                      <td className="py-3 pr-2">
                        <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleSelect(d.id)} />
                      </td>
                      <td className="py-3">
                        <div className="flex items-start gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-indigo-100">
                            {d.featuredImage?.url ? (
                              <Image src={d.featuredImage.url} alt="" fill className="object-cover" unoptimized />
                            ) : (
                              <div className="grid h-full place-items-center text-[10px] text-indigo-400">AI</div>
                            )}
                          </div>
                          <div>
                            <p className="line-clamp-2 font-bold">{d.title ?? d.rawTitle}</p>
                            <p className="muted text-xs">{new Date(d.createdAt).toLocaleString("hi-IN")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">{d.category ?? "—"}</td>
                      <td className="py-3">
                        <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" className="brand text-xs underline">
                          {d.sourceName}
                        </a>
                      </td>
                      <td className={`py-3 font-bold ${confidenceColor(d.aiConfidence)}`}>
                        {d.aiConfidence != null ? `${Math.round(d.aiConfidence * 100)}%` : "—"}
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusBadgeClass(d.status)}`}>
                          {AI_RADAR_STATUS_LABELS[d.status] ?? d.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          <button onClick={() => setPreview(d)} className="btn btn-ghost !p-1.5" title="पूर्वावलोकन">
                            <Eye size={14} />
                          </button>
                          {d.status === "FETCHED" && (
                            <button onClick={() => void generateDrafts(d.id)} className="btn btn-ghost !p-1.5" title="AI ड्राफ्ट">
                              <Sparkles size={14} />
                            </button>
                          )}
                          {d.status !== "PUBLISHED" && d.status !== "REJECTED" && (
                            <button onClick={() => setEditDraft({ ...d })} className="btn btn-ghost !p-1.5 text-xs">
                              संपादित
                            </button>
                          )}
                          {["DRAFT", "NEEDS_VERIFICATION", "APPROVED"].includes(d.status) && d.title && (
                            <button
                              onClick={() => void publishDraft(d)}
                              className="btn btn-ghost !p-1.5 text-xs text-green-700"
                              disabled={busy === `publish-${d.id}`}
                            >
                              प्रकाशित
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={7} className="muted py-8 text-center">
                        कोई AI समाचार नहीं — &quot;खबरें लाएं&quot; से शुरू करें
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {logs.length > 0 && (
            <div className="surface mt-6 rounded-xl p-5">
              <h2 className="font-black">हाल की API गतिविधि</h2>
              <div className="mt-3 grid gap-2">
                {logs.slice(0, 8).map((log) => (
                  <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 text-xs last:border-0" style={{ borderColor: "var(--line)" }}>
                    <span>
                      <strong>{log.action}</strong> — {log.message ?? "—"}
                    </span>
                    <span className={`font-bold ${log.status === "FAILED" ? "text-red-600" : "text-green-600"}`}>
                      {log.status} • {new Date(log.createdAt).toLocaleString("hi-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {preview && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4" onClick={() => setPreview(null)}>
          <div className="surface max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black">{preview.title ?? preview.rawTitle}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-bold ${statusBadgeClass(preview.status)}`}>
                {AI_RADAR_STATUS_LABELS[preview.status]}
              </span>
              <span className="muted">{AI_RADAR_VERIFICATION_LABELS[preview.verificationStatus]}</span>
            </div>
            {preview.imagePrompt && (
              <p className="mt-3 rounded bg-indigo-50 p-3 text-xs dark:bg-indigo-950/40">
                <strong>Image Prompt:</strong> {preview.imagePrompt}
              </p>
            )}
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{preview.content ?? preview.summary ?? "—"}</p>
            <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              AI जनित सामग्री — कृपया प्रकाशित करने से पहले तथ्यों की पुष्टि करें।
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setPreview(null)} className="btn btn-ghost">
                बंद करें
              </button>
              {preview.status !== "PUBLISHED" && preview.title && (
                <button onClick={() => void publishDraft(preview)} className="btn btn-primary !bg-indigo-700">
                  अनुमोदित करें और प्रकाशित करें
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {editDraft && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/50 p-4" onClick={() => setEditDraft(null)}>
          <div className="surface max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black">AI ड्राफ्ट संपादित करें</h2>
            <div className="mt-4 grid gap-3">
              <input className="input" value={editDraft.title ?? ""} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} placeholder="शीर्षक" />
              <input className="input" value={editDraft.slug ?? ""} onChange={(e) => setEditDraft({ ...editDraft, slug: e.target.value })} placeholder="slug" />
              <textarea className="input min-h-[200px]" value={editDraft.content ?? ""} onChange={(e) => setEditDraft({ ...editDraft, content: e.target.value })} placeholder="सामग्री" />
              <textarea className="input min-h-[60px]" value={editDraft.summary ?? ""} onChange={(e) => setEditDraft({ ...editDraft, summary: e.target.value })} placeholder="सारांश" />
              <input className="input" value={editDraft.category ?? ""} onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })} placeholder="श्रेणी" />
              <input className="input" value={editDraft.tags.join(", ")} onChange={(e) => setEditDraft({ ...editDraft, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="टैग" />
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMediaOpen(true)} className="btn btn-ghost">
                  फीचर्ड चित्र चुनें
                </button>
                {editDraft.featuredImage?.url && (
                  <span className="text-xs text-green-600">चित्र चयनित</span>
                )}
              </div>
              <select className="input" value={editDraft.status} onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value })}>
                {["DRAFT", "NEEDS_VERIFICATION", "APPROVED", "REJECTED"].map((s) => (
                  <option key={s} value={s}>
                    {AI_RADAR_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setEditDraft(null)} className="btn btn-ghost">
                रद्द
              </button>
              <button onClick={() => void saveDraft()} className="btn btn-primary !bg-indigo-700" disabled={busy === "save"}>
                ड्राफ्ट सुरक्षित करें
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(item: MediaItem) => {
          if (editDraft) setEditDraft({ ...editDraft, featuredImage: { id: item.id, url: item.url, alt: item.alt } });
          setMediaOpen(false);
        }}
      />
    </div>
  );
}
