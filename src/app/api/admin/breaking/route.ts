import { z } from "zod";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { breakingNewsSchema } from "@/lib/validators";

function parseBreakingDates(input: {
  startsAt?: string | null;
  expiresAt?: string | null;
}) {
  return {
    startsAt: input.startsAt ? new Date(input.startsAt) : input.startsAt === null ? null : undefined,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : input.expiresAt === null ? null : undefined,
  };
}

function breakingData(input: z.infer<typeof breakingNewsSchema>) {
  const dates = parseBreakingDates(input);
  return {
    title: input.title,
    link: input.link,
    articleId: input.articleId ?? null,
    enabled: input.enabled,
    sortOrder: input.sortOrder,
    ...(dates.startsAt !== undefined && { startsAt: dates.startsAt }),
    ...(dates.expiresAt !== undefined && { expiresAt: dates.expiresAt }),
  };
}

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
    const item = await prisma.breakingNews.create({ data: breakingData(input) });
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
          data: breakingData(item),
        })
      )
    );
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
