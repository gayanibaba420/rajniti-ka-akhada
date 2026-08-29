import { InfoPageView } from "@/components/info-page";
import { infoPages } from "@/lib/info-pages";

export default function AboutPage() {
  return <InfoPageView page={infoPages.about} />;
}
