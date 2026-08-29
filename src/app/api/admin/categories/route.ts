import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { categorySchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { articles: true } } },
    });
    return jsonOk({ categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
    const input = categorySchema.parse(await request.json());
    const category = await prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? "",
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return jsonOk({ category }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
