import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { aiNewsDraftUpdateSchema } from "@/lib/ai-radar/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const { id } = await ctx.params;

    const draft = await prisma.aiNewsDraft.findUnique({
      where: { id },
      include: {
        featuredImage: true,
        generationLogs: { orderBy: { createdAt: "desc" }, take: 10 },
        publishedArticle: { select: { id: true, slug: true, title: true } },
      },
    });
    if (!draft) return jsonError("ड्राफ्ट नहीं मिला", 404);
    return jsonOk({ draft });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
    const { id } = await ctx.params;

    const existing = await prisma.aiNewsDraft.findUnique({ where: { id } });
    if (!existing) return jsonError("ड्राफ्ट नहीं मिला", 404);
    if (existing.status === "PUBLISHED") return jsonError("प्रकाशित ड्राफ्ट संपादित नहीं किया जा सकता", 400);

    const input = aiNewsDraftUpdateSchema.parse(await request.json());

    const draft = await prisma.aiNewsDraft.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.summary !== undefined && { summary: input.summary }),
        ...(input.metaTitle !== undefined && { metaTitle: input.metaTitle }),
        ...(input.metaDescription !== undefined && { metaDescription: input.metaDescription }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.imagePrompt !== undefined && { imagePrompt: input.imagePrompt }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.featuredImageId !== undefined && { featuredImageId: input.featuredImageId }),
      },
      include: { featuredImage: true },
    });

    return jsonOk({ draft });
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

    const existing = await prisma.aiNewsDraft.findUnique({ where: { id } });
    if (!existing) return jsonError("ड्राफ्ट नहीं मिला", 404);
    if (existing.status === "PUBLISHED") return jsonError("प्रकाशित ड्राफ्ट हटाया नहीं जा सकता", 400);

    await prisma.aiNewsDraft.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
