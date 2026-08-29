import { InfoPageView } from "@/components/info-page";
import { infoPages } from "@/lib/info-pages";

export default function PrivacyPage() {
  return <InfoPageView page={infoPages.privacy} />;
}
