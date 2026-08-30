import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

const DEV_CATEGORIES = [
  { slug: "haryana", name: "हरियाणा", description: "हरियाणा की राजनीति, प्रशासन और जनसरोकार की हर खबर" },
  { slug: "hisar", name: "हिसार", description: "हिसार शहर, गांव, मंडी और आसपास की स्थानीय खबरें" },
  { slug: "politics", name: "राजनीति", description: "सत्ता, विपक्ष और लोकतंत्र का निष्पक्ष विश्लेषण" },
  { slug: "india", name: "देश", description: "भारत की प्रमुख और विश्वसनीय खबरें" },
  { slug: "world", name: "दुनिया", description: "दुनिया भर से महत्वपूर्ण घटनाक्रम" },
];

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW !== "1") {
    console.log("⏭️  Skipping seed in production (set SEED_ALLOW=1 to override). No demo articles are seeded.");
    return;
  }

  if (process.env.SEED_RESET === "1") {
    console.log("🔄 SEED_RESET=1 — wiping dev data (articles, media, etc.)...");
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
  }

  console.log("🌱 Seeding dev essentials (no demo news articles)...");

  const adminHash = await hashPassword("Admin@12345");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@rajnitikaakhada.in" },
    create: {
      email: "admin@rajnitikaakhada.in",
      name: "न्यूज़ डेस्क",
      passwordHash: adminHash,
      role: "SUPER_ADMIN",
    },
    update: {},
  });

  await prisma.author.upsert({
    where: { slug: "news-desk" },
    create: { name: "न्यूज़ डेस्क", slug: "news-desk", userId: adminUser.id, bio: "संपादकीय डेस्क" },
    update: {},
  });

  for (let i = 0; i < DEV_CATEGORIES.length; i++) {
    const cat = DEV_CATEGORIES[i];
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { slug: cat.slug, name: cat.name, description: cat.description, sortOrder: i },
      update: { name: cat.name, description: cat.description, sortOrder: i },
    });
  }

  console.log("✅ Seed complete (categories + admin only — add news via admin panel)");
  console.log("   Admin: admin@rajnitikaakhada.in / Admin@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
