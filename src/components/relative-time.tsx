"use client";

import { useEffect, useState } from "react";
import { formatRelativeTimeHindi } from "@/lib/types";

const UPDATE_INTERVAL_MS = 30_000;

export function RelativeTime({
  iso,
  className,
  title,
}: {
  iso: string;
  className?: string;
  title?: string;
}) {
  const [label, setLabel] = useState(() => formatRelativeTimeHindi(iso));

  useEffect(() => {
    setLabel(formatRelativeTimeHindi(iso));
    const tick = () => setLabel(formatRelativeTimeHindi(iso));
    const id = setInterval(tick, UPDATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [iso]);

  return (
    <time dateTime={iso} className={className} title={title ?? iso} suppressHydrationWarning>
      {label}
    </time>
  );
}
