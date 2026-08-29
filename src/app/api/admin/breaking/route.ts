import { z } from "zod";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { breakingNewsSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const items = await prisma.breakingNews.findMany({
      include: { article: { select: { slug: true, title: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return jsonOk({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const input = breakingNewsSchema.parse(await request.json());
    const item = await prisma.breakingNews.create({ data: input });
    return jsonOk({ item }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);
    const body = await request.json();
    const schema = breakingNewsSchema.extend({ id: z.string() });
    const items = z.array(schema).parse(body.items);
    await prisma.$transaction(
      items.map((item) =>
        prisma.breakingNews.update({
          where: { id: item.id },
          data: {
            title: item.title,
            link: item.link,
            articleId: item.articleId ?? null,
            enabled: item.enabled,
            sortOrder: item.sortOrder,
          },
        })
      )
    );
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
