"use client";

import { useEffect, useState } from "react";

interface Reaction {
  id: string;
  emoji: string;
  label: string;
  defaultCount: number;
}

const REACTIONS: Reaction[] = [
  { id: "like", emoji: "👍", label: "काम की खबर", defaultCount: 42 },
  { id: "heart", emoji: "❤️", label: "शानदार", defaultCount: 28 },
  { id: "clap", emoji: "👏", label: "सराहनीय", defaultCount: 19 },
  { id: "shocked", emoji: "😲", label: "हैरान", defaultCount: 15 },
  { id: "angry", emoji: "😡", label: "चिंताजनक", defaultCount: 11 },
];

export function ArticleReactions({ articleSlug }: { articleSlug: string }) {
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem(`reaction_${articleSlug}`);
    if (saved) setUserReaction(saved);

    // Initial randomized realistic count based on slug seed
    const initial: Record<string, number> = {};
    const seed = articleSlug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    REACTIONS.forEach((r, idx) => {
      initial[r.id] = r.defaultCount + ((seed + idx * 7) % 25);
    });
    setCounts(initial);
  }, [articleSlug]);

  function handleReact(id: string) {
    if (userReaction === id) {
      setUserReaction(null);
      localStorage.removeItem(`reaction_${articleSlug}`);
      setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 1) - 1) }));
      return;
    }

    if (userReaction) {
      setCounts((prev) => ({ ...prev, [userReaction]: Math.max(0, (prev[userReaction] || 1) - 1) }));
    }

    setUserReaction(id);
    localStorage.setItem(`reaction_${articleSlug}`, id);
    setCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  return (
    <div className="my-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 p-5 text-center shadow-xs">
      <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">
        इस खबर पर आपकी क्या राय है? अपनी प्रतिक्रिया दें
      </h3>
      <p className="text-xs text-neutral-500 font-semibold mt-1">
        आपकी राय हमारे लिए महत्वपूर्ण है
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {REACTIONS.map((r) => {
          const isSelected = userReaction === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleReact(r.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition transform active:scale-95 ${
                isSelected
                  ? "bg-[var(--brand)] text-white shadow-md scale-105"
                  : "bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700"
              }`}
            >
              <span className="text-lg leading-none">{r.emoji}</span>
              <span className="font-extrabold">{r.label}</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {counts[r.id] ?? r.defaultCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
