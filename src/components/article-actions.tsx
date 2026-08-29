"use client";

import { useState } from "react";
import { Bookmark, Check, Facebook, Link2, MessageCircle, Send } from "lucide-react";

export function ShareActions({ title }: { title: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return <div className="flex flex-wrap gap-2"><button className="btn btn-ghost !p-2.5" aria-label="Facebook पर साझा करें"><Facebook size={18}/></button><button className="btn btn-ghost !p-2.5" aria-label="WhatsApp पर साझा करें"><MessageCircle size={18}/></button><button onClick={copy} className="btn btn-ghost !p-2.5" aria-label={`${title} का लिंक कॉपी करें`}>{copied?<Check size={18}/>:<Link2 size={18}/>}</button><button onClick={()=>setSaved(!saved)} className={`btn ${saved?"btn-primary":"btn-ghost"} !p-2.5`} aria-label="खबर सहेजें"><Bookmark size={18} fill={saved?"currentColor":"none"}/></button></div>;
}

export function Comments() {
  const [comments, setComments] = useState(["बहुत उपयोगी और संतुलित जानकारी। स्थानीय मुद्दों पर ऐसी रिपोर्टिंग जरूरी है।"]);
  const [value, setValue] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = value.replace(/<[^>]*>/g, "").trim().slice(0, 500);
    if (!clean) return;
    setComments([...comments, clean]); setValue("");
  }
  return <section className="surface mt-10 rounded-xl p-5 sm:p-7"><h2 className="section-title !text-xl">पाठकों की राय ({comments.length})</h2><form onSubmit={submit}><label htmlFor="comment" className="mb-2 block text-sm font-bold">अपनी टिप्पणी लिखें</label><textarea id="comment" className="input min-h-28" maxLength={500} value={value} onChange={(e)=>setValue(e.target.value)} placeholder="सम्मानजनक और विषय से जुड़ी टिप्पणी..." /><div className="mt-3 flex items-center justify-between"><span className="muted text-xs">टिप्पणियां प्रकाशन से पहले मॉडरेट की जाती हैं।</span><button className="btn btn-primary" type="submit"><Send size={16}/> भेजें</button></div></form><div className="mt-6 grid gap-4">{comments.map((comment,i)=><div className="rounded-xl bg-black/[.035] p-4 dark:bg-white/[.04]" key={`${comment}-${i}`}><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--brand)] font-black text-white">प</span><div><strong>पाठक {i+1}</strong><p className="muted text-xs">अभी</p></div></div><p className="mt-3 leading-7">{comment}</p></div>)}</div></section>;
}
