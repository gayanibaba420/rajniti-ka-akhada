"use client";

import { useEffect } from "react";
import { apiPath } from "@/lib/api-client";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(apiPath("/api/public/views"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => undefined);
  }, [slug]);
  return null;
}
