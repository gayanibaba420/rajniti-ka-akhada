import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { parseContentInput, resolveArticleAuthorId } from "@/lib/blogs";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { revalidateBlogPages } from "@/lib/revalidate";
import { blogInputSchema, prepareBlogInput } from "@/lib/validators";
import { slugify } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit") ?? 50);

    const rows = await prisma.blogPost.findMany({
      where: status ? { status: status as never } : {},
      include: { author: true, featuredImage: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return jsonOk({ blogs: rows });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const input = blogInputSchema.parse(prepareBlogInput(await request.json()));
    const content = parseContentInput(input.content);

    let publishedAt: Date | null = input.publishedAt ? new Date(input.publishedAt) : null;
    const status = input.status;

    if (status === "PUBLISHED" && !publishedAt) {
      publishedAt = new Date();
    }

    const slug = input.slug || slugify(input.title);
    const authorId = await resolveArticleAuthorId(
      { authorId: input.authorId, authorName: input.authorName },
      session.id,
    );

    const blog = await prisma.blogPost.create({
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: content as never,
        status,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        tags: input.tags ?? [],
        publishedAt,
        authorId,
        featuredImageId: input.featuredImageId ?? null,
      },
      include: { author: true, featuredImage: true },
    });

    revalidateBlogPages({ slug: blog.slug });

    return jsonOk({ blog }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
