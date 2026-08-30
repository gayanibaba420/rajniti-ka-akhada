import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { breakingNewsSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

function revalidateBreakingPages() {
  revalidatePath("/", "layout");
  revalidatePath("/");
}

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const { id } = await ctx.params;
    const input = breakingNewsSchema.partial().parse(await request.json());
    const dates = {
      startsAt: input.startsAt !== undefined
        ? (input.startsAt ? new Date(input.startsAt) : null)
        : undefined,
      expiresAt: input.expiresAt !== undefined
        ? (input.expiresAt ? new Date(input.expiresAt) : null)
        : undefined,
    };
    const item = await prisma.breakingNews.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.link !== undefined && { link: input.link }),
        ...(input.articleId !== undefined && { articleId: input.articleId ?? null }),
        ...(input.enabled !== undefined && { enabled: input.enabled }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(dates.startsAt !== undefined && { startsAt: dates.startsAt }),
        ...(dates.expiresAt !== undefined && { expiresAt: dates.expiresAt }),
      },
    });
    revalidateBreakingPages();
    return jsonOk({ item });
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
    await prisma.breakingNews.delete({ where: { id } });
    revalidateBreakingPages();
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
