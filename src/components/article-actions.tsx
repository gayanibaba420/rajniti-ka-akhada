"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check, Link2, MessageCircle, Printer, Send, Share2 as Facebook } from "lucide-react";

export function ShareActions({ title }: { title: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  function pageUrl() {
    return typeof window !== "undefined" ? window.location.href : "";
  }

  async function copy() {
    const url = pageUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function shareFacebook() {
    const url = pageUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=500",
    );
  }

  function shareWhatsApp() {
    const url = pageUrl();
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={shareFacebook} className="btn btn-ghost touch-target !p-2.5" aria-label="Facebook पर साझा करें">
          <Facebook size={18} />
        </button>
        <button type="button" onClick={shareWhatsApp} className="btn btn-ghost touch-target !p-2.5" aria-label="WhatsApp पर साझा करें">
          <MessageCircle size={18} />
        </button>
        <button onClick={copy} className="btn btn-ghost touch-target !p-2.5" aria-label={`${title} का लिंक कॉपी करें`}>
          {copied ? <Check size={18} /> : <Link2 size={18} />}
        </button>
        <button onClick={() => setSaved(!saved)} className={`btn touch-target ${saved ? "btn-primary" : "btn-ghost"} !p-2.5`} aria-label="खबर सहेजें">
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      {copied && (
        <div className="share-toast" role="status" aria-live="polite">
          लिंक कॉपी हो गया!
        </div>
      )}
    </>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-ghost touch-target text-sm"
      aria-label="लेख प्रिंट करें"
    >
      <Printer size={16} /> प्रिंट
    </button>
  );
}

interface CommentItem { content: string; authorName: string; createdAt: string }

export function Comments({ articleSlug }: { articleSlug: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [value, setValue] = useState("");
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch(`/api/public/comments?slug=${encodeURIComponent(articleSlug)}`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => undefined);
  }, [articleSlug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = value.replace(/<[^>]*>/g, "").trim().slice(0, 500);
    if (!clean || !name.trim()) return;
    const res = await fetch("/api/public/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: articleSlug, authorName: name.trim(), content: clean }),
    });
    const data = await res.json();
    if (res.ok) {
      setNotice(data.message ?? "टिप्पणी भेजी गई");
      setValue("");
    } else {
      setNotice(data.error ?? "त्रुटि");
    }
  }

  return <section className="surface mt-10 rounded-xl p-5 sm:p-7"><h2 className="section-title !text-xl">पाठकों की राय ({comments.length})</h2>{notice && <p className="mt-2 text-sm text-green-700">{notice}</p>}<form onSubmit={submit}><label htmlFor="name" className="mb-2 block text-sm font-bold">नाम</label><input id="name" className="input mb-3" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} required /><label htmlFor="comment" className="mb-2 block text-sm font-bold">अपनी टिप्पणी लिखें</label><textarea id="comment" className="input min-h-28" maxLength={500} value={value} onChange={(e)=>setValue(e.target.value)} placeholder="सम्मानजनक और विषय से जुड़ी टिप्पणी..." required /><div className="mt-3 flex items-center justify-between"><span className="muted text-xs">टिप्पणियां प्रकाशन से पहले मॉडरेट की जाती हैं।</span><button className="btn btn-primary touch-target" type="submit"><Send size={16}/> भेजें</button></div></form><div className="mt-6 grid gap-4">{comments.map((comment,i)=><div className="rounded-xl bg-black/[.035] p-4 dark:bg-white/[.04]" key={`${comment.createdAt}-${i}`}><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--brand)] font-black text-white">{comment.authorName[0]}</span><div><strong>{comment.authorName}</strong><p className="muted text-xs">{new Intl.DateTimeFormat("hi-IN").format(new Date(comment.createdAt))}</p></div></div><p className="mt-3 leading-7">{comment.content}</p></div>)}</div></section>;
}
