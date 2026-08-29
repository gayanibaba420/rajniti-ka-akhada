import Image from "next/image";
import type { ContentBlock } from "@/lib/types";

export function renderContentBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2 key={index} className="mt-8 text-2xl font-black">
          {block.text}
        </h2>
      ) : (
        <h3 key={index} className="mt-6 text-xl font-black">
          {block.text}
        </h3>
      );
    case "quote":
      return (
        <blockquote key={index} className="my-6 border-l-4 border-[var(--brand)] pl-4 italic">
          {block.text}
          {block.cite && <cite className="mt-2 block text-sm not-italic">— {block.cite}</cite>}
        </blockquote>
      );
    case "list":
      return block.ordered ? (
        <ol key={index} className="my-4 list-decimal pl-6">
          {block.items.map((item, i) => (
            <li key={i} className="mb-2">
              {item}
            </li>
          ))}
        </ol>
      ) : (
        <ul key={index} className="my-4 list-disc pl-6">
          {block.items.map((item, i) => (
            <li key={i} className="mb-2">
              {item}
            </li>
          ))}
        </ul>
      );
    case "image":
      return (
        <figure key={index} className="my-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
            <Image src={block.url} alt={block.alt ?? ""} fill className="object-cover" sizes="800px" />
          </div>
          {block.caption && <figcaption className="muted mt-2 text-xs">{block.caption}</figcaption>}
        </figure>
      );
    case "embed":
      return (
        <div key={index} className="my-6 aspect-video overflow-hidden rounded-xl">
          <iframe src={block.url} className="h-full w-full" title="embedded content" allowFullScreen />
        </div>
      );
    default:
      return <p key={index}>{block.text}</p>;
  }
}
