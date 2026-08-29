import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { mediaUpdateSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const { id } = await ctx.params;
    const input = mediaUpdateSchema.parse(await request.json());
    const media = await prisma.media.update({ where: { id }, data: input });
    return jsonOk({ media });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
    const { id } = await ctx.params;
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return jsonError("मीडिया नहीं मिला", 404);

    if (media.storageKey) {
      try {
        const storage = getStorageProvider();
        if (storage.isConfigured()) await storage.delete(media.storageKey);
      } catch {
        // storage delete failure should not block DB cleanup
      }
    }

    await prisma.media.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
