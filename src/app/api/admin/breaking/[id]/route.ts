import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { breakingNewsSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const { id } = await ctx.params;
    const input = breakingNewsSchema.partial().parse(await request.json());
    const item = await prisma.breakingNews.update({ where: { id }, data: input });
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
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
