import type { InfoPage } from "@/lib/info-pages";

export function InfoPageView({ page }: { page: InfoPage }) {
  return (
    <article className="container-main min-h-[50vh] max-w-3xl py-12">
      <h1 className="section-title">{page.title}</h1>
      <div className="surface prose-news rounded-2xl p-6 sm:p-9">
        {page.body.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
    </article>
  );
}
