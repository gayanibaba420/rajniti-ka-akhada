export const GA_CONSENT_KEY = "cookie-consent";
export const GA_CONSENT_ACCEPTED = "accepted";
export const GA_CONSENT_EVENT = "cookie-consent-accepted";

export function getGaMeasurementId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GA_ID?.trim();
  return id || undefined;
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(GA_CONSENT_KEY) === GA_CONSENT_ACCEPTED;
  } catch {
    return false;
  }
}

export function acceptAnalyticsConsent(): void {
  try {
    localStorage.setItem(GA_CONSENT_KEY, GA_CONSENT_ACCEPTED);
  } catch {
    // ignore storage failures
  }
  window.dispatchEvent(new Event(GA_CONSENT_EVENT));
}

export function sendGaPageView(path: string): void {
  const gaId = getGaMeasurementId();
  if (!gaId || typeof window.gtag !== "function") return;
  window.gtag("config", gaId, { page_path: path });
}
