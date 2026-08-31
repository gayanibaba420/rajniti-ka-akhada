"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { PublicArticle } from "@/lib/types";

export function WebStoriesSection({ articles }: { articles: PublicArticle[] }) {
  const stories = articles.filter((a) => a.image).slice(0, 6);
  if (stories.length === 0) return null;

  return (
    <section className="my-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-amber-500 via-red-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles size={16} />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-neutral-100">
            विजुअल वेब स्टोरीज़
          </h2>
        </div>
        <span className="text-xs font-bold text-neutral-500">फोटो & हाइलाइट्स</span>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 pt-1">
        {stories.map((story) => (
          <Link
            key={story.slug}
            href={`/article/${story.slug}`}
            className="group relative flex-none w-36 sm:w-44 h-64 sm:h-72 rounded-2xl overflow-hidden shadow-md border-2 border-transparent hover:border-red-500 transition-all transform hover:-translate-y-1"
          >
            {story.image && (
              <Image
                src={story.image}
                alt={story.title}
                fill
                className="object-cover group-hover:scale-105 transition duration-500"
              />
            )}
            {/* Story Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

            {/* Story Top Ring Indicator */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center gap-1">
              <span className="h-1 flex-1 bg-white/70 rounded-full" />
              <span className="h-1 flex-1 bg-white/40 rounded-full" />
              <span className="h-1 flex-1 bg-white/40 rounded-full" />
            </div>

            {/* Story Title & Badge */}
            <div className="absolute bottom-0 inset-x-0 p-3 text-white">
              <span className="inline-block bg-[var(--brand)] text-[9px] font-black px-1.5 py-0.5 rounded mb-1.5 uppercase">
                {story.categoryName || story.category}
              </span>
              <h3 className="text-xs font-bold leading-snug line-clamp-3 text-white">
                {story.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
