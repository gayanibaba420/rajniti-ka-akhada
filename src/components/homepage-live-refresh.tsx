"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const POLL_INTERVAL_MS = 30_000;

export function HomepageLiveRefresh({
  latestSlug,
  latestPublishedAt,
}: {
  latestSlug: string;
  latestPublishedAt: string;
}) {
  const router = useRouter();
  const latestRef = useRef({ slug: latestSlug, publishedAt: latestPublishedAt });

  useEffect(() => {
    latestRef.current = { slug: latestSlug, publishedAt: latestPublishedAt };
  }, [latestSlug, latestPublishedAt]);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/public/articles?limit=1", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { latestSlug?: string; latestPublishedAt?: string };
        const { slug, publishedAt } = latestRef.current;
        if (data.latestSlug && data.latestSlug !== slug) {
          router.refresh();
        } else if (data.latestPublishedAt && data.latestPublishedAt !== publishedAt) {
          router.refresh();
        }
      } catch {
        /* ignore network errors */
      }
    };

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
