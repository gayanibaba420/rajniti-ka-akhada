"use client";

import Link from "next/link";
import { Feather } from "lucide-react";
import type { PublicArticle } from "@/lib/types";

export function OpinionDeskSection({ articles }: { articles: PublicArticle[] }) {
  const list = articles.slice(0, 3);
  if (list.length === 0) return null;

  return (
    <section className="my-10 rounded-2xl bg-neutral-900 text-white p-6 sm:p-7 shadow-lg border border-neutral-800">
      <div className="flex items-center justify-between mb-5 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center text-black shadow-xs">
            <Feather size={16} />
          </div>
          <h2 className="text-lg sm:text-xl font-black">संपादकीय & ओपिनियन डेस्क</h2>
        </div>
        <span className="text-xs text-amber-400 font-bold">बेबाक विश्लेषण</span>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {list.map((item) => (
          <Link
            key={item.slug}
            href={`/article/${item.slug}`}
            className="group rounded-xl bg-neutral-800/80 hover:bg-neutral-800 p-4 border border-neutral-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-[var(--brand)] text-[10px] font-black flex items-center justify-center text-white uppercase">
                  {(item.author || "सं")[0]}
                </div>
                <span className="text-xs text-neutral-300 font-bold">{item.author || "संपादक मंडल"}</span>
              </div>
              <h3 className="text-sm font-bold leading-snug group-hover:text-amber-400 transition line-clamp-2">
                {item.title}
              </h3>
            </div>

            <p className="text-xs text-neutral-400 line-clamp-2 mt-3 font-medium">
              {item.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
