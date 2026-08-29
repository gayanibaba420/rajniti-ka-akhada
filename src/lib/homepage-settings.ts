export const HOMEPAGE_SECTION_KEYS = [
  { key: "homepage_show_lead", label: "मुख्य बड़ी खबर" },
  { key: "homepage_show_trending", label: "ट्रेंडिंग / सबसे ज्यादा पढ़ी" },
  { key: "homepage_show_live", label: "लाइव अपडेट" },
  { key: "homepage_show_hisar", label: "हिसार स्पेशल" },
  { key: "homepage_show_haryana", label: "हरियाणा की हलचल" },
  { key: "homepage_show_politics", label: "सियासी अखाड़ा" },
  { key: "homepage_show_india", label: "देश-दुनिया" },
  { key: "homepage_show_sports", label: "खेल, कारोबार और करियर" },
  { key: "homepage_show_entertainment", label: "मनोरंजन और टेक" },
  { key: "homepage_show_video", label: "वीडियो न्यूज़ बैनर" },
] as const;

export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number]["key"];

export type HomepageSettings = {
  featuredSlug: string;
  sections: Record<HomepageSectionKey, boolean>;
};

const DEFAULT_SECTIONS: Record<HomepageSectionKey, boolean> = Object.fromEntries(
  HOMEPAGE_SECTION_KEYS.map(({ key }) => [key, true]),
) as Record<HomepageSectionKey, boolean>;

export function parseHomepageSettings(settings: Record<string, string> = {}): HomepageSettings {
  const sections = { ...DEFAULT_SECTIONS };
  for (const { key } of HOMEPAGE_SECTION_KEYS) {
    const value = settings[key]?.trim();
    if (value === "0" || value === "false") sections[key] = false;
  }
  return {
    featuredSlug: settings.homepage_featured_slug?.trim() ?? "",
    sections,
  };
}

export function isHomepageSectionEnabled(settings: HomepageSettings, key: HomepageSectionKey): boolean {
  return settings.sections[key] ?? true;
}
