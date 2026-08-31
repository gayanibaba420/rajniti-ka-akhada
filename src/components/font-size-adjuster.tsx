"use client";

import { useEffect, useState } from "react";
import { Type } from "lucide-react";

export function FontSizeAdjuster() {
  const [size, setSize] = useState<"normal" | "large" | "xlarge">("normal");

  useEffect(() => {
    const saved = localStorage.getItem("news-font-size");
    if (saved === "large" || saved === "xlarge") {
      setSize(saved);
      applyClass(saved);
    }
  }, []);

  function applyClass(nextSize: string) {
    const prose = document.querySelector(".prose-news");
    if (!prose) return;
    prose.classList.remove("text-base", "text-lg", "text-xl");
    if (nextSize === "large") prose.classList.add("text-lg");
    else if (nextSize === "xlarge") prose.classList.add("text-xl");
    else prose.classList.add("text-base");
  }

  function handleSize(nextSize: "normal" | "large" | "xlarge") {
    setSize(nextSize);
    localStorage.setItem("news-font-size", nextSize);
    applyClass(nextSize);
  }

  return (
    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-black">
      <span className="px-1.5 text-neutral-500 flex items-center gap-0.5">
        <Type size={12} />
        <span>फ़ॉन्ट:</span>
      </span>
      <button
        type="button"
        onClick={() => handleSize("normal")}
        className={`px-2 py-1 rounded-lg transition ${
          size === "normal"
            ? "bg-white dark:bg-neutral-700 text-[var(--brand)] shadow-2xs font-extrabold"
            : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
        }`}
        title="सामान्य आकार"
      >
        A
      </button>
      <button
        type="button"
        onClick={() => handleSize("large")}
        className={`px-2 py-1 rounded-lg text-sm transition ${
          size === "large"
            ? "bg-white dark:bg-neutral-700 text-[var(--brand)] shadow-2xs font-extrabold"
            : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
        }`}
        title="बड़ा आकार"
      >
        A+
      </button>
      <button
        type="button"
        onClick={() => handleSize("xlarge")}
        className={`px-2 py-1 rounded-lg text-base transition ${
          size === "xlarge"
            ? "bg-white dark:bg-neutral-700 text-[var(--brand)] shadow-2xs font-extrabold"
            : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
        }`}
        title="बहुत बड़ा आकार"
      >
        A++
      </button>
    </div>
  );
}
