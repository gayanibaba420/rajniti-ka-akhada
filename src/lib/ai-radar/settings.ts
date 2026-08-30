import { prisma } from "@/lib/db";
import { DEFAULT_AI_RADAR_SETTINGS, type AiRadarSettings } from "./types";

const SETTINGS_KEY = "ai_radar_config";
const GEMINI_KEY_SETTING = "gemini_api_key";

function readRuntimeEnv(name: string): string | undefined {
  return process.env[name];
}

export function getGeminiApiKeyFromEnv(): string | null {
  const key = readRuntimeEnv("GEMINI_API_KEY");
  return key?.trim() || null;
}

export async function getGeminiApiKey(): Promise<string | null> {
  const fromEnv = getGeminiApiKeyFromEnv();
  if (fromEnv) return fromEnv;

  const row = await prisma.siteSetting.findUnique({ where: { key: GEMINI_KEY_SETTING } });
  const fromDb = row?.value?.trim();
  return fromDb || null;
}

export async function saveGeminiApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) return;

  await prisma.siteSetting.upsert({
    where: { key: GEMINI_KEY_SETTING },
    create: { key: GEMINI_KEY_SETTING, value: trimmed },
    update: { value: trimmed },
  });
}

export function getGnewsApiKey(): string | null {
  const key = readRuntimeEnv("GNEWS_API_KEY");
  return key?.trim() || null;
}

export async function getApiKeyStatus() {
  return {
    geminiConfigured: Boolean(await getGeminiApiKey()),
    gnewsConfigured: Boolean(getGnewsApiKey()),
  };
}

export async function getAiRadarSettings(): Promise<AiRadarSettings> {
  const row = await prisma.siteSetting.findUnique({ where: { key: SETTINGS_KEY } });
  if (!row?.value) return { ...DEFAULT_AI_RADAR_SETTINGS };

  try {
    const parsed = JSON.parse(row.value) as Partial<AiRadarSettings>;
    return {
      ...DEFAULT_AI_RADAR_SETTINGS,
      ...parsed,
      categories: parsed.categories?.length ? parsed.categories : DEFAULT_AI_RADAR_SETTINGS.categories,
    };
  } catch {
    return { ...DEFAULT_AI_RADAR_SETTINGS };
  }
}

export async function saveAiRadarSettings(settings: AiRadarSettings): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });
}

export async function ensureDefaultCategories(): Promise<void> {
  const count = await prisma.aiNewsCategory.count();
  if (count > 0) return;

  const defaults = DEFAULT_AI_RADAR_SETTINGS.categories;
  await prisma.$transaction(
    defaults.map((name, index) =>
      prisma.aiNewsCategory.create({
        data: {
          name,
          slug: name
            .toLowerCase()
            .replace(/\//g, "-")
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/^-+|-+$/g, ""),
          sortOrder: index,
          enabled: true,
        },
      }),
    ),
  );
}
