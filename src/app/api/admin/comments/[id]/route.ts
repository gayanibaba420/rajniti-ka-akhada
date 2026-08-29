import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { commentModerationSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
    const { id } = await ctx.params;
    const { approved } = commentModerationSchema.parse(await request.json());
    const comment = await prisma.comment.update({ where: { id }, data: { approved } });
    return jsonOk({ comment });
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
    await prisma.comment.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
