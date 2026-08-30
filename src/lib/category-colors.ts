const CATEGORY_COLORS: Record<string, string> = {
  politics: "#A71D2A",
  haryana: "#1E3A5F",
  hisar: "#1E3A5F",
  sports: "#1B6B3A",
  entertainment: "#6B21A8",
  india: "#475569",
  world: "#475569",
  technology: "#0F766E",
  business: "#0F766E",
  education: "#92400E",
  blog: "#92400E",
};

export function getCategoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] ?? "var(--brand)";
}
