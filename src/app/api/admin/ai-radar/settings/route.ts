import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import {
  ensureDefaultCategories,
  getAiRadarSettings,
  getApiKeyStatus,
  saveAiRadarSettings,
  saveGeminiApiKey,
} from "@/lib/ai-radar/settings";
import { aiRadarSettingsSchema } from "@/lib/ai-radar/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    await ensureDefaultCategories();
    const [settings, apiKeys] = await Promise.all([getAiRadarSettings(), getApiKeyStatus()]);

    return jsonOk({ settings, apiKeys });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);

    const body = (await request.json()) as Record<string, unknown>;
    const { geminiApiKey, ...settingsBody } = body;
    const settings = aiRadarSettingsSchema.parse(settingsBody);
    await saveAiRadarSettings(settings);

    if (typeof geminiApiKey === "string" && geminiApiKey.trim()) {
      await saveGeminiApiKey(geminiApiKey);
    }

    const apiKeys = await getApiKeyStatus();
    return jsonOk({ ok: true, settings, apiKeys });
  } catch (error) {
    return handleApiError(error);
  }
}
