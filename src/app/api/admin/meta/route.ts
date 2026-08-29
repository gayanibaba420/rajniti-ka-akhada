import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const [categories, authors, tags] = await Promise.all([
      prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      prisma.author.findMany({ orderBy: { name: "asc" } }),
      prisma.tag.findMany({ orderBy: { name: "asc" } }),
    ]);
    return jsonOk({ categories, authors, tags });
  } catch (error) {
    return handleApiError(error);
  }
}
