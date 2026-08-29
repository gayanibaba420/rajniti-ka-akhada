"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface BreakingItem {
  title: string;
  slug: string | null;
  link: string;
}

export function BreakingTickerClient({ initialItems }: { initialItems: BreakingItem[] }) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    fetch("/api/public/breaking")
      .then((r) => r.json())
      .then((data) => {
        if (data.items?.length) setItems(data.items);
      })
      .catch(() => undefined);
  }, []);

  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="ticker flex overflow-hidden bg-[#a71d2a] text-white">
      <div className="z-10 shrink-0 bg-[#74111b] px-4 py-2.5 text-sm font-black">ब्रेकिंग</div>
      <div className="overflow-hidden">
        <div className="ticker-track">
          {loop.map((item, index) => (
            <Link
              className="whitespace-nowrap px-8 py-2.5 text-sm font-bold"
              href={item.slug ? `/article/${item.slug}` : item.link}
              key={`${item.title}-${index}`}
            >
              ● &nbsp; {item.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
