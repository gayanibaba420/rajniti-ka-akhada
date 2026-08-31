"use client";

import { MessageCircle, Bell, ArrowRight } from "lucide-react";

export function WhatsAppJoinBanner() {
  return (
    <div className="my-8 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 shadow-xl relative">
      <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 pointer-events-none">
        <MessageCircle size={160} />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-black backdrop-blur-xs">
            <Bell size={12} className="animate-bounce" />
            <span>सीधे अपने फोन पर ब्रेकिंग न्यूज़ पाएं</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black leading-snug">
            हरियाणा व हिसार की हर बड़ी खबर सबसे पहले पाने के लिए जुड़ें!
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium">
            'राजनीति का अखाड़ा' के आधिकारिक WhatsApp चैनल पर पाएं 24x7 ताज़ा अपडेट्स, वीडियो व विश्लेषण।
          </p>
        </div>

        <a
          href="https://whatsapp.com/channel/0029Va9W87bEwEjx1r"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 px-5 py-3 rounded-xl font-black text-sm transition shadow-lg shrink-0 active:scale-95"
        >
          <MessageCircle size={18} className="text-emerald-600 fill-emerald-600" />
          <span>व्हाट्सएप ग्रुप से जुड़ें</span>
          <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}
