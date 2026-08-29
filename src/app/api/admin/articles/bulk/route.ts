import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { revalidatePublicPages } from "@/lib/revalidate";
import { tryPublishArticleToFacebook } from "@/lib/facebook";

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  action: z.enum(["publish", "draft", "delete"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const { ids, action } = bulkSchema.parse(await request.json());

    if (action === "delete") {
      requireRole(session.role, ["SUPER_ADMIN", "EDITOR"]);
    } else if (action === "publish") {
      requireRole(session.role, ["SUPER_ADMIN", "EDITOR", "AUTHOR"]);
    }

    const articles = await prisma.article.findMany({
      where: { id: { in: ids } },
      include: { category: { select: { slug: true } } },
    });

    if (!articles.length) return jsonError("कोई समाचार नहीं मिला", 404);

    if (session.role === "AUTHOR") {
      const unauthorized = articles.some((a) => a.createdById !== session.id);
      if (unauthorized) return jsonError("अनुमति नहीं", 403);
    }

    let affected = 0;

    if (action === "delete") {
      await prisma.article.deleteMany({ where: { id: { in: ids } } });
      affected = articles.length;
      for (const article of articles) {
        revalidatePublicPages({ slug: article.slug, categorySlug: article.category.slug });
      }
    } else if (action === "draft") {
      await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { status: "DRAFT" },
      });
      affected = articles.length;
      for (const article of articles) {
        revalidatePublicPages({ slug: article.slug, categorySlug: article.category.slug });
      }
    } else {
      const now = new Date();
      for (const article of articles) {
        const wasPublished = article.status === "PUBLISHED";
        await prisma.article.update({
          where: { id: article.id },
          data: {
            status: "PUBLISHED",
            publishedAt: article.publishedAt ?? now,
          },
        });
        if (!wasPublished) {
          await tryPublishArticleToFacebook(article.id);
        }
        revalidatePublicPages({ slug: article.slug, categorySlug: article.category.slug });
        affected++;
      }
    }

    const messages = {
      publish: `${affected} समाचार प्रकाशित`,
      draft: `${affected} समाचार ड्राफ्ट में`,
      delete: `${affected} समाचार हटाए गए`,
    };

    return jsonOk({ affected, message: messages[action] });
  } catch (error) {
    return handleApiError(error);
  }
}
