"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CloudSun, MessageCircle, TrendingUp, Tv, Newspaper, Calendar } from "lucide-react";

interface WeatherCity {
  name: string;
  temp: number;
  condition: string;
  icon: string;
}

const CITIES: WeatherCity[] = [
  { name: "हिसार", temp: 33, condition: "धूप", icon: "☀️" },
  { name: "चंडीगढ़", temp: 31, condition: "साफ़", icon: "🌤️" },
  { name: "रोहतक", temp: 32, condition: "धूप", icon: "☀️" },
  { name: "गुरुग्राम", temp: 34, condition: "आंशिक बादल", icon: "⛅" },
];

export function TopInfoBar() {
  const [cityIndex, setCityIndex] = useState(0);
  const [marketIndex, setMarketIndex] = useState(0);

  const dateStr = useMemo(() => {
    return new Intl.DateTimeFormat("hi-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  const marketPulse = [
    { label: "सोना (24K)", val: "₹72,450/10g", change: "+₹210", up: true },
    { label: "चांदी", val: "₹85,200/kg", change: "+₹450", up: true },
    { label: "सेंसेक्स", val: "81,780", change: "+240", up: true },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCityIndex((prev) => (prev + 1) % CITIES.length);
      setMarketIndex((prev) => (prev + 1) % marketPulse.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [marketPulse.length]);

  const currentCity = CITIES[cityIndex];
  const currentMarket = marketPulse[marketIndex];

  return (
    <div className="bg-[#111] text-neutral-300 text-[11px] font-bold py-1.5 border-b border-neutral-800 select-none">
      <div className="container-main flex items-center justify-between gap-3">
        {/* Left: Date & Live Panchang */}
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <span className="flex items-center gap-1 text-white">
            <Calendar size={12} className="text-[#e8a526]" />
            {dateStr}
          </span>
          <span className="hidden md:inline text-neutral-500">|</span>
          <span className="hidden md:flex items-center gap-1 text-neutral-400">
            भाद्रपद कृष्ण पक्ष
          </span>
        </div>

        {/* Center: Live Weather & Market Pulse */}
        <div className="flex items-center gap-4 overflow-hidden">
          {/* Weather Ticker */}
          <div
            onClick={() => setCityIndex((prev) => (prev + 1) % CITIES.length)}
            className="flex items-center gap-1.5 cursor-pointer hover:text-white transition"
            title="क्लिक करके शहर बदलें"
          >
            <span>{currentCity.icon}</span>
            <span className="text-white font-black">{currentCity.name}</span>
            <span className="text-amber-400 font-extrabold">{currentCity.temp}°C</span>
          </div>

          <span className="hidden sm:inline text-neutral-600">|</span>

          {/* Market Pulse Ticker */}
          <div className="hidden sm:flex items-center gap-1.5 text-neutral-400">
            <TrendingUp size={12} className="text-emerald-400" />
            <span>{currentMarket.label}:</span>
            <span className="text-white font-bold">{currentMarket.val}</span>
            <span className="text-emerald-400 text-[10px] font-black">{currentMarket.change}</span>
          </div>
        </div>

        {/* Right: Fast Actions (WhatsApp, Live TV, E-Paper) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="https://whatsapp.com/channel/0029Va9W87bEwEjx1r"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-emerald-600/90 hover:bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black transition shadow-xs"
          >
            <MessageCircle size={11} />
            <span>WhatsApp ग्रुप</span>
          </a>

          <Link
            href="/search?q=video"
            className="hidden sm:flex items-center gap-1 hover:text-red-400 transition"
          >
            <Tv size={12} className="text-red-500 animate-pulse" />
            <span>वीडियो न्यूज़</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
