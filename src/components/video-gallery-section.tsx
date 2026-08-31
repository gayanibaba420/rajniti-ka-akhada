"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Tv, X } from "lucide-react";
import { toVideoEmbedUrl } from "@/lib/video-url";

interface VideoItem {
  id: string;
  title: string;
  category: string;
  videoUrl: string;
  thumbnail: string;
  duration?: string;
}

const SAMPLE_VIDEOS: VideoItem[] = [
  {
    id: "v1",
    title: "हरियाणा विधानसभा में मानसून सत्र के दौरान तीखी बहस: ग्राउंड रिपोर्ट",
    category: "राजनीति",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80",
    duration: "4:15",
  },
  {
    id: "v2",
    title: "हिसार एयरपोर्ट से उड़ानों को लेकर ताज़ा अपडेट और जनसंवाद",
    category: "हिसार",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
    duration: "6:20",
  },
  {
    id: "v3",
    title: "हरियाणा में फसलों के भाव व मंडियों की ताज़ा स्थिति पर विशेष चर्चा",
    category: "किसान",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80",
    duration: "5:40",
  },
];

export function VideoGallerySection() {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const embedUrl = activeVideo ? toVideoEmbedUrl(activeVideo.videoUrl) : null;

  return (
    <section className="my-12 rounded-3xl bg-[#141414] text-white p-6 sm:p-8 shadow-2xl overflow-hidden border border-neutral-800">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
            <Tv size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black">वीडियो न्यूज़ & ग्राउंड रिपोर्ट</h2>
            <p className="text-xs text-neutral-400 font-bold">राजनीति का अखाड़ा की खास पेशकश</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_VIDEOS.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveVideo(item)}
            className="group cursor-pointer rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-red-600 transition shadow-lg flex flex-col"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition duration-300 opacity-90"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition" />

              {/* Play Badge */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-red-600 transition">
                  <Play size={20} fill="currentColor" className="translate-x-0.5" />
                </div>
              </div>

              <span className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-[10px] font-black text-white">
                {item.category}
              </span>

              {item.duration && (
                <span className="absolute bottom-2.5 right-2.5 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-neutral-300">
                  {item.duration}
                </span>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <h3 className="text-sm sm:text-base font-bold leading-snug group-hover:text-red-400 transition line-clamp-2">
                {item.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="w-full max-w-3xl bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="text-sm font-black text-white line-clamp-1">{activeVideo.title}</h3>
              <button onClick={() => setActiveVideo(null)} className="btn btn-ghost !p-2 text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="aspect-video w-full">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="h-full w-full"
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="grid h-full place-items-center text-neutral-500 text-sm">वीडियो लोड नहीं हो सका</div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
