import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { parseContentInput, resolveArticleAuthorId } from "@/lib/blogs";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { revalidateBlogPages } from "@/lib/revalidate";
import { blogInputSchema, prepareBlogInput } from "@/lib/validators";
import { slugify } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const { id } = await params;
    const blog = await prisma.blogPost.findUnique({
      where: { id },
      include: { author: true, featuredImage: true },
    });
    if (!blog) return jsonError("ब्लॉग नहीं मिला", 404);
    return jsonOk({ blog });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const { id } = await params;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return jsonError("ब्लॉग नहीं मिला", 404);

    const input = blogInputSchema.parse(prepareBlogInput(await request.json()));
    const content = parseContentInput(input.content);

    let publishedAt: Date | null = input.publishedAt ? new Date(input.publishedAt) : existing.publishedAt;
    const status = input.status;

    if (status === "PUBLISHED" && !publishedAt) {
      publishedAt = new Date();
    }
    if (status === "DRAFT") {
      publishedAt = null;
    }

    const authorId = await resolveArticleAuthorId(
      { authorId: input.authorId, authorName: input.authorName },
      session.id,
    );

    const blog = await prisma.blogPost.update({
      where: { id },
      data: {
        title: input.title,
        slug: input.slug || slugify(input.title),
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
    if (existing.slug !== blog.slug) {
      revalidateBlogPages({ slug: existing.slug });
    }

    return jsonOk({ blog });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const { id } = await params;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return jsonError("ब्लॉग नहीं मिला", 404);

    await prisma.blogPost.delete({ where: { id } });
    revalidateBlogPages({ slug: existing.slug });

    return jsonOk({ message: "ब्लॉग हटाया गया" });
  } catch (error) {
    return handleApiError(error);
  }
}
