import { NextRequest } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { aiNewsBulkSchema } from "@/lib/ai-radar/validators";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);

    const { ids, action } = aiNewsBulkSchema.parse(await request.json());

    if (action === "delete") {
      const result = await prisma.aiNewsDraft.deleteMany({
        where: { id: { in: ids }, status: { not: "PUBLISHED" } },
      });
      return jsonOk({ message: `${result.count} हटाए गए`, count: result.count });
    }

    if (action === "reject") {
      const result = await prisma.aiNewsDraft.updateMany({
        where: { id: { in: ids }, status: { not: "PUBLISHED" } },
        data: { status: "REJECTED" },
      });
      return jsonOk({ message: `${result.count} अस्वीकृत`, count: result.count });
    }

    const result = await prisma.aiNewsDraft.updateMany({
      where: {
        id: { in: ids },
        status: { in: ["DRAFT", "NEEDS_VERIFICATION", "FETCHED"] },
      },
      data: { status: "APPROVED" },
    });
    return jsonOk({ message: `${result.count} स्वीकृत`, count: result.count });
  } catch (error) {
    return handleApiError(error);
  }
}
