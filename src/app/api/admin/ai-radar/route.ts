import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { getAiRadarStats, getRecentLogs } from "@/lib/ai-radar/logging";
import { getApiKeyStatus, getAiRadarSettings } from "@/lib/ai-radar/settings";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

    const [drafts, stats, settings, logs, apiKeys] = await Promise.all([
      prisma.aiNewsDraft.findMany({
        where: status ? { status: status as never } : {},
        include: { featuredImage: { select: { id: true, url: true, alt: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      getAiRadarStats(),
      getAiRadarSettings(),
      getRecentLogs(15),
      Promise.resolve(getApiKeyStatus()),
    ]);

    return jsonOk({ drafts, stats, settings, logs, apiKeys });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);

    const { ids } = (await request.json()) as { ids?: string[] };
    if (!ids?.length) return jsonError("IDs आवश्यक", 400);

    const result = await prisma.aiNewsDraft.deleteMany({
      where: { id: { in: ids }, status: { not: "PUBLISHED" } },
    });

    return jsonOk({ deleted: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
