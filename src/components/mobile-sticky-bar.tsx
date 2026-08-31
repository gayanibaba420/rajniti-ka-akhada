"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, ArrowUp, Home, Share2, Search } from "lucide-react";

export function MobileStickyBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShow(window.scrollY > 300);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: "राजनीति का अखाड़ा",
        url: window.location.href,
      }).catch(() => undefined);
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, "_blank");
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 z-50 md:hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="surface mx-auto max-w-sm rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-4 py-2.5 shadow-2xl flex items-center justify-between">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-neutral-600 dark:text-neutral-400 hover:text-[var(--brand)]">
          <Home size={18} />
          <span className="text-[9px] font-bold">होम</span>
        </Link>

        <a
          href="https://whatsapp.com/channel/0029Va9W87bEwEjx1r"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-sm"
        >
          <MessageCircle size={14} />
          <span>व्हाट्सएप</span>
        </a>

        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-0.5 text-neutral-600 dark:text-neutral-400 hover:text-[var(--brand)]"
          aria-label="शेयर करें"
        >
          <Share2 size={18} />
          <span className="text-[9px] font-bold">शेयर</span>
        </button>

        <button
          onClick={scrollToTop}
          className="flex flex-col items-center gap-0.5 text-neutral-600 dark:text-neutral-400 hover:text-[var(--brand)]"
          aria-label="ऊपर जाएं"
        >
          <ArrowUp size={18} />
          <span className="text-[9px] font-bold">ऊपर</span>
        </button>
      </div>
    </div>
  );
}
