import { getCategoryColor } from "@/lib/category-colors";

export function CategoryBadge({
  label,
  slug,
  className = "",
}: {
  label: string;
  slug: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-1 text-xs font-black text-white ${className}`}
      style={{ backgroundColor: getCategoryColor(slug) }}
    >
      {label}
    </span>
  );
}
