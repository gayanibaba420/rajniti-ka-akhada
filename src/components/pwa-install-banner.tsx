"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="ऐप इंस्टॉल करें"
      className="fixed inset-x-0 bottom-0 z-[95] border-t border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">ऐप इंस्टॉल करें</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
            होम स्क्रीन पर जोड़ें और तेज़, ऐप जैसा अनुभव पाएं।
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--line)]/40"
          aria-label="बंद करें"
        >
          <X size={18} />
        </button>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white touch-target hover:bg-[var(--brand-dark)]"
      >
        <Download size={18} />
        होम स्क्रीन पर जोड़ें
      </button>
    </div>
  );
}
