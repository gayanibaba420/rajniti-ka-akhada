import { InfoPageView } from "@/components/info-page";
import { infoPages } from "@/lib/info-pages";

export default function TermsPage() {
  return <InfoPageView page={infoPages.terms} />;
}
