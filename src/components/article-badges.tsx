import Link from "next/link";

export function EditorsPickBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded bg-[#e8a526] px-2.5 py-1 text-xs font-black text-[#151515] ${className}`}>
      संपादक की पसंद
    </span>
  );
}

export function AuthorLink({ name, slug, className = "" }: { name: string; slug: string; className?: string }) {
  return (
    <Link href={`/author/${slug}`} className={`font-bold text-[var(--foreground)] hover:text-[var(--brand)] ${className}`}>
      {name}
    </Link>
  );
}
