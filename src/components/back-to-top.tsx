"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 right-5 z-[90] grid h-12 w-12 place-items-center rounded-full bg-[var(--brand)] text-white shadow-lg transition hover:bg-[var(--brand-dark)] md:hidden touch-target"
      aria-label="ऊपर जाएं"
    >
      <ArrowUp size={22} />
    </button>
  );
}
