"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, Check } from "lucide-react";

export const HARYANA_DISTRICTS = [
  "हिसार",
  "रोहतक",
  "भिवानी",
  "सिरसा",
  "जींद",
  "फतेहाबाद",
  "करनाल",
  "पानीपत",
  "सोनीपत",
  "कुरुक्षेत्र",
  "गुरुग्राम",
  "फरीदाबाद",
  "अंबाला",
  "यमुनानगर",
  "पंचकूला",
  "कैथल",
  "झज्जर",
  "रेवाड़ी",
  "महेंद्रगढ़",
  "नूंह",
  "पलवल",
  "चरखी दादरी",
];

export function DistrictSelectorBar() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>("हिसार");
  const [isOpen, setIsOpen] = useState(false);

  function handleSelect(district: string) {
    setSelected(district);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(district)}`);
  }

  return (
    <div className="bg-neutral-100 dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-800 py-2.5">
      <div className="container-main flex flex-wrap items-center justify-between gap-3">
        {/* Left District Label & Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="flex items-center gap-1 text-xs font-black text-[var(--brand)] shrink-0 bg-[var(--brand)]/10 px-2.5 py-1 rounded-md">
            <MapPin size={13} />
            <span>ज़िला समाचार:</span>
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {HARYANA_DISTRICTS.slice(0, 8).map((d) => (
              <button
                key={d}
                onClick={() => handleSelect(d)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  selected === d
                    ? "bg-[var(--brand)] text-white shadow-xs"
                    : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Dropdown for All 22 Districts */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 text-xs font-black bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 rounded-lg shadow-2xs hover:border-[var(--brand)] transition"
          >
            <span>सभी 22 ज़िले</span>
            <ChevronDown size={13} className={`transition transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div className="absolute right-0 mt-2 z-50 w-72 max-h-80 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl p-3 grid grid-cols-2 gap-1.5 animate-in fade-in zoom-in-95">
                {HARYANA_DISTRICTS.map((dist) => (
                  <button
                    key={dist}
                    onClick={() => handleSelect(dist)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-bold text-left transition ${
                      selected === dist
                        ? "bg-[var(--brand)] text-white"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <span>{dist}</span>
                    {selected === dist && <Check size={13} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
