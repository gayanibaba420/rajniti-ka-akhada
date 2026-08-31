"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import type { PublicArticle } from "@/lib/types";

export function TrendingRankingWidget({ articles }: { articles: PublicArticle[] }) {
  const topList = articles.slice(0, 5);
  if (topList.length === 0) return null;

  return (
    <div className="surface rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-4">
        <div className="h-7 w-7 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-xs">
          <Flame size={16} />
        </div>
        <h3 className="text-base font-black text-neutral-900 dark:text-neutral-100">
          सबसे ज्यादा पढ़ी गईं (Top 5)
        </h3>
      </div>

      <div className="space-y-4">
        {topList.map((item, idx) => (
          <Link
            key={item.slug}
            href={`/article/${item.slug}`}
            className="group flex items-start gap-3.5"
          >
            {/* Number Rank Badge */}
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-sm font-black transition ${
              idx === 0
                ? "bg-red-600 text-white shadow-xs scale-105"
                : idx === 1
                  ? "bg-amber-500 text-white"
                  : idx === 2
                    ? "bg-orange-500 text-white"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            }`}>
              {idx + 1}
            </span>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black text-[var(--brand)] uppercase">
                {item.categoryName || item.category}
              </span>
              <h4 className="text-xs sm:text-sm font-bold leading-snug text-neutral-800 dark:text-neutral-200 group-hover:text-[var(--brand)] transition line-clamp-2 mt-0.5">
                {item.title}
              </h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
