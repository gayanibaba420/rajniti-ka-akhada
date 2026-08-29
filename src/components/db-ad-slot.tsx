import type { AdPosition } from "@prisma/client";
import { getActiveAds } from "@/lib/articles";
import { safeDbQuery } from "@/lib/public-data";

const LABELS: Record<AdPosition, string> = {
  HEADER: "लीडरबोर्ड • 970 × 90",
  HOMEPAGE: "होमपेज विज्ञापन",
  ARTICLE_TOP: "लेख शीर्ष विज्ञापन",
  ARTICLE_MIDDLE: "इन-आर्टिकल विज्ञापन • 728 × 90",
  ARTICLE_BOTTOM: "लेख नीचे विज्ञापन",
  SIDEBAR: "साइडबार विज्ञापन • 300 × 250",
};

export async function DbAdSlot({ position, label }: { position: AdPosition; label?: string }) {
  const ads = await safeDbQuery(() => getActiveAds(position), []);
  const ad = ads[0];
  const displayLabel = label ?? LABELS[position];

  if (!ad) {
    return (
      <div className="surface grid min-h-24 place-items-center rounded-xl border-dashed p-5 text-center">
        <div>
          <span className="muted text-[10px] tracking-[.25em]">ADVERTISEMENT</span>
          <p className="mt-1 text-sm font-bold">{displayLabel}</p>
        </div>
      </div>
    );
  }

  if (ad.code.startsWith("<!--")) {
    return (
      <div className="surface grid min-h-24 place-items-center rounded-xl border-dashed p-5 text-center">
        <div>
          <span className="muted text-[10px] tracking-[.25em]">ADVERTISEMENT</span>
          <p className="mt-1 text-sm font-bold">{ad.name}</p>
        </div>
      </div>
    );
  }

  if (ad.code.startsWith("http") || ad.code.startsWith("/")) {
    return (
      <div className="surface overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.code} alt={ad.name} className="mx-auto max-h-32 w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="ad-slot surface min-h-24 overflow-hidden rounded-xl p-2" dangerouslySetInnerHTML={{ __html: ad.code }} />
  );
}
