import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryCard } from "@/components/story-card";
import { getArticlesByAuthor, getAuthorBySlug, getCategories } from "@/lib/articles";
import { checkDbConnection } from "@/lib/db";
import { getPublicSiteConfig, safeDbQuery } from "@/lib/public-data";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await safeDbQuery(() => getAuthorBySlug(slug), null);
  if (!author) return {};
  return {
    title: `${author.name} — लेखक`,
    description: author.bio ?? `${author.name} द्वारा लिखित समाचार`,
  };
}

export default async function AuthorPage({ params }: Props) {
  const dbOk = await checkDbConnection();
  if (!dbOk) {
    return (
      <div className="container-main py-20 text-center">
        <h1 className="text-2xl font-black">सेवा अस्थायी रूप से अनुपलब्ध</h1>
      </div>
    );
  }

  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const [articles, categories, config] = await Promise.all([
    getArticlesByAuthor(slug, 30),
    safeDbQuery(() => getCategories(), []),
    getPublicSiteConfig(),
  ]);

  return (
    <div className="container-main py-10">
      <nav aria-label="ब्रेडक्रंब" className="muted mb-6 text-sm">
        <Link href="/">होम</Link> / {author.name}
      </nav>

      <header className="surface flex flex-col gap-6 rounded-2xl p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-full bg-[var(--brand)] sm:mx-0">
          {author.avatar ? (
            <Image src={author.avatar} alt={author.name} fill className="object-cover" sizes="112px" unoptimized={author.avatar.startsWith("http")} />
          ) : (
            <span className="grid h-full w-full place-items-center text-4xl font-black text-white">{author.name[0]}</span>
          )}
        </div>
        <div className="text-center sm:text-left">
          <span className="eyebrow">लेखक</span>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">{author.name}</h1>
          {author.bio && <p className="muted mt-3 max-w-2xl leading-7">{author.bio}</p>}
          <p className="muted mt-3 text-sm">{articles.length} प्रकाशित लेख</p>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="section-title">{author.name} की खबरें</h2>
        {articles.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <StoryCard key={article.slug} article={article} categories={categories} />
            ))}
          </div>
        ) : (
          <p className="muted py-10 text-center">अभी कोई प्रकाशित लेख नहीं।</p>
        )}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: {
              "@type": "Person",
              name: author.name,
              description: author.bio,
              url: `${config.url}/author/${author.slug}`,
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
