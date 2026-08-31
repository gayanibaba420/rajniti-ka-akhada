"use client";

import { useEffect, useState } from "react";

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const currentProgress = (window.scrollY / totalHeight) * 100;
      setProgress(Math.min(100, Math.max(0, currentProgress)));
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1.5 z-[100] bg-transparent pointer-events-none transition-all"
    >
      <div
        className="h-full bg-gradient-to-r from-red-600 via-[var(--brand)] to-amber-500 transition-all duration-75 shadow-sm"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
