import { requireCronAuth } from "@/lib/api-utils";
import { handleApiError, jsonOk } from "@/lib/api-utils";
import { runAiNewsPipeline } from "@/lib/ai-radar/pipeline";
import { getAiRadarSettings } from "@/lib/ai-radar/settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireCronAuth(request);
    const settings = await getAiRadarSettings();
    if (!settings.enabled) {
      return jsonOk({ skipped: true, reason: "AI News Radar disabled", at: new Date().toISOString() });
    }

    const result = await runAiNewsPipeline();
    return jsonOk({ ...result, at: new Date().toISOString() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  return GET(request);
}
