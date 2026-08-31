"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  BookOpen,
  FilePenLine,
  FolderTree,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Megaphone,
  Radar,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { AiRadarPanel } from "@/components/admin/ai-radar-panel";
import { BlogEditor } from "@/components/admin/blog-editor";
import { PostEditor } from "@/components/admin/post-editor";
import {
  AdsPanel,
  BlogsPanel,
  BreakingPanel,
  CategoriesPanel,
  CommentsPanel,
  DashboardPanel,
  MediaPanel,
  PostsPanel,
  SettingsPanelUnified,
} from "@/components/admin/panels";
import { ErrorBlock } from "@/components/admin/shared";
import type { AdminSection, AnalyticsSummary, ArticleRow, BlogRow, Meta, User } from "@/components/admin/types";

const sections = [
  ["dashboard", "डैशबोर्ड", LayoutDashboard],
  ["posts", "समाचार", FilePenLine],
  ["blogs", "ब्लॉग", BookOpen],
  ["media", "मीडिया", ImageIcon],
  ["categories", "श्रेणियाँ", FolderTree],
  ["breaking", "ब्रेकिंग", BellRing],
  ["comments", "टिप्पणियाँ", MessageSquare],
  ["ads", "विज्ञापन", Megaphone],
  ["ai-radar", "AI News Radar", Radar],
  ["settings", "सेटिंग्स", Settings],
] as const;

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [active, setActive] = useState<AdminSection>("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [editing, setEditing] = useState<ArticleRow | null | "new">(null);
  const [initialPostData, setInitialPostData] = useState<{ title?: string; slug?: string; excerpt?: string; content?: string; categoryId?: string; tags?: string; location?: string } | null>(null);
  const [editingBlog, setEditingBlog] = useState<BlogRow | null | "new">(null);
  const [notice, setNotice] = useState("");
  const [dbError, setDbError] = useState("");
  const [loading, setLoading] = useState(true);

  const flash = useCallback((text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2800);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user) {
        router.push("/admin/login");
        return;
      }
      setUser(me.user);
      const [metaRes, articlesRes, blogsRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/meta"),
        fetch("/api/admin/articles"),
        fetch("/api/admin/blogs"),
        fetch("/api/admin/analytics"),
      ]);
      if (!metaRes.ok || !articlesRes.ok) throw new Error("DB");
      setMeta(await metaRes.json());
      setArticles((await articlesRes.json()).articles ?? []);
      if (blogsRes.ok) setBlogs((await blogsRes.json()).blogs ?? []);
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      setDbError("");
    } catch {
      setDbError("डेटाबेस कनेक्शन विफल — admin सुविधाएं सीमित हैं।");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  function clearEditors() {
    setEditing(null);
    setInitialPostData(null);
    setEditingBlog(null);
  }

  const content = useMemo(() => {
    if (dbError && !meta) return <ErrorBlock message={dbError} />;
    if (loading && !meta) {
      return (
        <div className="grid min-h-[40vh] place-items-center">
          <p className="muted animate-pulse font-bold">लोड हो रहा है...</p>
        </div>
      );
    }
    if (editing && meta) {
      return (
        <PostEditor
          meta={meta}
          article={editing === "new" ? null : editing}
          initialData={editing === "new" ? initialPostData : null}
          currentUser={user}
          close={() => {
            setEditing(null);
            setInitialPostData(null);
          }}
          onSaved={(msg) => {
            setEditing(null);
            setInitialPostData(null);
            load();
            flash(msg ?? "सुरक्षित किया गया");
          }}
        />
      );
    }
    if (editingBlog && meta) {
      return (
        <BlogEditor
          meta={meta}
          blog={editingBlog === "new" ? null : editingBlog}
          currentUser={user}
          close={() => setEditingBlog(null)}
          onSaved={(msg) => {
            setEditingBlog(null);
            load();
            flash(msg ?? "सुरक्षित किया गया");
          }}
        />
      );
    }
    switch (active) {
      case "posts":
        return (
          <PostsPanel
            articles={articles}
            edit={(a) => {
              clearEditors();
              setEditing(a);
            }}
            create={() => {
              clearEditors();
              setEditing("new");
            }}
            onRefresh={load}
            flash={flash}
          />
        );
      case "blogs":
        return (
          <BlogsPanel
            blogs={blogs}
            edit={(b) => {
              clearEditors();
              setEditingBlog(b);
            }}
            create={() => {
              clearEditors();
              setEditingBlog("new");
            }}
            onRefresh={load}
            flash={flash}
          />
        );
      case "media":
        return <MediaPanel flash={flash} />;
      case "categories":
        return <CategoriesPanel flash={flash} onMetaRefresh={load} />;
      case "breaking":
        return <BreakingPanel flash={flash} />;
      case "comments":
        return <CommentsPanel flash={flash} />;
      case "ads":
        return <AdsPanel flash={flash} />;
      case "ai-radar":
        return (
          <AiRadarPanel
            flash={flash}
            meta={meta}
            currentUser={user}
            onOpenEditor={(data) => {
              clearEditors();
              setInitialPostData(data);
              setEditing("new");
            }}
            onRefresh={load}
          />
        );
      case "settings":
        return <SettingsPanelUnified flash={flash} />;
      default:
        return (
          <DashboardPanel
            analytics={analytics}
            articles={articles}
            create={() => {
              clearEditors();
              setEditing("new");
            }}
            openPosts={() => setActive("posts")}
          />
        );
    }
  }, [active, editing, editingBlog, articles, blogs, analytics, meta, dbError, load, flash, loading, user]);

  const isEditing = Boolean(editing || editingBlog);

  if (!user && !dbError && loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="muted font-bold">लोड हो रहा है...</p>
      </div>
    );
  }

  return (
    <div className="admin-grid bg-[var(--background)]">
      {mobileMenu && (
        <button
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="मेन्यू बंद करें"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside
        className={`${mobileMenu ? "fixed inset-y-0 left-0 z-50 flex" : "hidden"} w-[235px] flex-col bg-[#17191c] p-4 text-white md:flex`}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="font-black">
            राजनीति का <span className="text-[#ef4050]">अखाड़ा</span>
            <span className="block text-xs font-medium text-neutral-400">संपादकीय CMS</span>
          </Link>
          <button className="md:hidden" onClick={() => setMobileMenu(false)} aria-label="मेन्यू बंद करें">
            <X />
          </button>
        </div>
        <nav className="mt-5 grid gap-1">
          {sections.map(([id, label, Icon]) => (
            <button
              onClick={() => {
                setActive(id);
                clearEditors();
                setMobileMenu(false);
              }}
              key={id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold ${active === id && !isEditing ? (id === "ai-radar" ? "bg-indigo-700" : "bg-[var(--brand)]") : "hover:bg-white/10"}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-lg bg-white/5 p-3 text-xs text-neutral-400">
          <ShieldCheck className="mb-2 text-green-400" size={20} />
          {user?.role ?? "—"} • PostgreSQL CMS
        </div>
      </aside>
      <main className="min-w-0">
        <header className="surface flex h-16 items-center justify-between border-x-0 border-t-0 px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenu(true)} className="btn btn-ghost !p-2 md:hidden" aria-label="मेन्यू खोलें">
              <Menu />
            </button>
            <div>
              <strong>नमस्ते, {user?.name ?? "संपादक"}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn btn-ghost text-sm">
              साइट देखें
            </Link>
            <button onClick={logout} className="btn btn-ghost text-sm">
              <LogOut size={16} /> लॉगआउट
            </button>
          </div>
        </header>
        <div className="p-4 sm:p-7">
          {notice && (
            <div role="status" className="fixed right-5 top-5 z-[80] rounded-lg bg-green-700 px-4 py-3 font-bold text-white shadow-xl">
              {notice}
            </div>
          )}
          {content}
        </div>
      </main>
    </div>
  );
}
