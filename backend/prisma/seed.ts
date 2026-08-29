import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { demoCategories as categories, demoArticles } from "./demo-data";
import { plainTextToBlocks } from "../src/lib/types";

async function main() {
  console.log("🌱 Seeding database with DEMO production data...");

  await prisma.articleView.deleteMany();
  await prisma.articleTag.deleteMany();
  await prisma.scheduledPost.deleteMany();
  await prisma.breakingNews.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.article.deleteMany();
  await prisma.media.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.author.deleteMany();
  await prisma.category.deleteMany();
  await prisma.advertisement.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await hashPassword("Admin@12345");
  const editorHash = await hashPassword("Editor@12345");
  const authorHash = await hashPassword("Author@12345");

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@rajnitikaakhada.in",
      name: "न्यूज़ डेस्क",
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
    },
  });

  const editorUser = await prisma.user.create({
    data: {
      email: "editor@rajnitikaakhada.in",
      name: "साक्षी दहिया",
      passwordHash: editorHash,
      role: "EDITOR",
    },
  });

  const authorUser = await prisma.user.create({
    data: {
      email: "author@rajnitikaakhada.in",
      name: "अमित मलिक",
      passwordHash: authorHash,
      role: "AUTHOR",
    },
  });

  const authors = await Promise.all([
    prisma.author.create({ data: { name: "न्यूज़ डेस्क", slug: "news-desk", userId: adminUser.id, bio: "संपादकीय डेस्क" } }),
    prisma.author.create({ data: { name: "साक्षी दहिया", slug: "sakshi-dahiya", userId: editorUser.id, bio: "हरियाणा संपादक" } }),
    prisma.author.create({ data: { name: "अमित मलिक", slug: "amit-malik", userId: authorUser.id, bio: "स्थानीय रिपोर्टर" } }),
  ]);

  const categoryMap: Record<string, string> = {};
  for (let i = 0; i < categories.length; i++) {
    const cat = await prisma.category.create({
      data: { slug: categories[i].slug, name: categories[i].name, description: categories[i].description, sortOrder: i },
    });
    categoryMap[cat.slug] = cat.id;
  }

  const authorRotation = [authors[0], authors[1], authors[2]];

  for (let index = 0; index < demoArticles.length; index++) {
    const demo = demoArticles[index];
    const author = authorRotation[index % 3];
    const content = plainTextToBlocks(demo.content);

    const article = await prisma.article.create({
      data: {
        slug: demo.slug,
        title: demo.title,
        excerpt: demo.excerpt,
        content: content as never,
        location: demo.location,
        status: "PUBLISHED",
        featured: demo.featured ?? false,
        breaking: demo.breaking ?? false,
        trending: index < 5,
        viewCount: demo.views,
        readTimeMinutes: parseInt(demo.readTime) || 3,
        publishedAt: new Date(demo.publishedAt),
        categoryId: categoryMap[demo.category],
        authorId: author.id,
        createdById: author.userId,
        seoTitle: demo.title,
        seoDescription: demo.excerpt,
      },
    });

    for (const tagName of demo.tags) {
      const slug = tagName.toLowerCase().replace(/\s+/g, "-").slice(0, 80);
      const tag = await prisma.tag.upsert({
        where: { slug },
        create: { slug, name: tagName },
        update: { name: tagName },
      });
      await prisma.articleTag.create({ data: { articleId: article.id, tagId: tag.id } });
    }

    if (demo.breaking) {
      await prisma.breakingNews.create({
        data: { title: demo.title, articleId: article.id, enabled: true, sortOrder: index },
      });
    }
  }

  await prisma.advertisement.createMany({
    data: [
      { name: "DEMO Header Leaderboard", position: "HEADER", code: "<!-- DEMO: Header ad slot -->", enabled: true, sortOrder: 0 },
      { name: "DEMO Homepage Banner", position: "HOMEPAGE", code: "<!-- DEMO: Homepage ad slot -->", enabled: true, sortOrder: 0 },
      { name: "DEMO Article Inline", position: "ARTICLE_MIDDLE", code: "<!-- DEMO: In-article ad slot -->", enabled: true, sortOrder: 0 },
      { name: "DEMO Sidebar", position: "SIDEBAR", code: "<!-- DEMO: Sidebar ad slot -->", enabled: true, sortOrder: 0 },
    ],
  });

  await prisma.siteSetting.createMany({
    data: [
      { key: "site_name", value: "राजनीति का अखाड़ा" },
      { key: "site_tagline", value: "हिंदी समाचार • निष्पक्ष विचार" },
      { key: "site_description", value: "हरियाणा, हिसार, राजनीति और देश-दुनिया की विश्वसनीय हिंदी खबरें।" },
      { key: "contact_email", value: "sampark@rajnitikaakhada.in" },
      { key: "demo_notice", value: "DEMO: Seeded demo articles preserved for production migration" },
    ],
  });

  console.log("✅ Seed complete");
  console.log("   Admin: admin@rajnitikaakhada.in / Admin@12345");
  console.log("   Editor: editor@rajnitikaakhada.in / Editor@12345");
  console.log("   Author: author@rajnitikaakhada.in / Author@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
