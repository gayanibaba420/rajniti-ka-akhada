"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { GA_CONSENT_EVENT, getGaMeasurementId, hasAnalyticsConsent, sendGaPageView } from "@/lib/analytics";

function GoogleAnalyticsTracker() {
  const gaId = getGaMeasurementId();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consented, setConsented] = useState(false);
  const skipNextPageView = useRef(true);

  useEffect(() => {
    setConsented(hasAnalyticsConsent());

    function onConsent() {
      setConsented(true);
    }

    window.addEventListener(GA_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(GA_CONSENT_EVENT, onConsent);
  }, []);

  useEffect(() => {
    if (!consented || !gaId) return;
    if (skipNextPageView.current) {
      skipNextPageView.current = false;
      return;
    }
    const query = searchParams.toString();
    sendGaPageView(query ? `${pathname}?${query}` : pathname);
  }, [consented, gaId, pathname, searchParams]);

  if (!gaId || !consented) return null;

  return <GoogleAnalytics gaId={gaId} />;
}

export function GoogleAnalyticsProvider() {
  if (!getGaMeasurementId()) return null;

  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsTracker />
    </Suspense>
  );
}
