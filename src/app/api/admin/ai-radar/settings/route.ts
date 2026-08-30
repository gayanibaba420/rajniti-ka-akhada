import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import {
  ensureDefaultCategories,
  getAiRadarSettings,
  getApiKeyStatus,
  saveAiRadarSettings,
} from "@/lib/ai-radar/settings";
import { aiRadarSettingsSchema } from "@/lib/ai-radar/validators";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    await ensureDefaultCategories();
    const [settings, apiKeys] = await Promise.all([getAiRadarSettings(), Promise.resolve(getApiKeyStatus())]);

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

    const settings = aiRadarSettingsSchema.parse(await request.json());
    await saveAiRadarSettings(settings);

    return jsonOk({ ok: true, settings });
  } catch (error) {
    return handleApiError(error);
  }
}
