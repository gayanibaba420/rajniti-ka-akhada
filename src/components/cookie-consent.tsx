"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { acceptAnalyticsConsent, GA_CONSENT_ACCEPTED, GA_CONSENT_KEY, getGaMeasurementId } from "@/lib/analytics";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getGaMeasurementId()) return;
    try {
      setVisible(localStorage.getItem(GA_CONSENT_KEY) !== GA_CONSENT_ACCEPTED);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="कुकी सहमति"
      className="fixed inset-x-0 bottom-0 z-[100] border-t bg-[var(--surface)] p-4 shadow-[0_-8px_30px_rgba(0,0,0,.12)] sm:p-5"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="container-main flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed sm:max-w-3xl">
          हम cookies का उपयोग करते हैं ताकि साइट का उपयोग समझ सकें और सेवा बेहतर बना सकें। विवरण के लिए{" "}
          <Link href="/privacy" className="font-bold underline underline-offset-2">
            गोपनीयता नीति
          </Link>{" "}
          देखें।
        </p>
        <button
          type="button"
          className="btn btn-primary shrink-0"
          onClick={() => {
            acceptAnalyticsConsent();
            setVisible(false);
          }}
        >
          स्वीकार करें
        </button>
      </div>
    </div>
  );
}
