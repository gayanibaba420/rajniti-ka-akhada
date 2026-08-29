import { InfoPageView } from "@/components/info-page";
import { getPublicSiteConfig } from "@/lib/public-data";

export default async function ContactPage() {
  const site = await getPublicSiteConfig();
  const contactLines = [
    `संपादकीय सुझाव और सुधार के लिए हमें ${site.email} पर लिखें।`,
    site.phone ? `फ़ोन: ${site.phone}` : null,
    "किसी खबर से जुड़ी संवेदनशील जानकारी भेजते समय निजी या गोपनीय डेटा साझा न करें। उत्पादन सेवा में सुरक्षित टिपलाइन अलग से जोड़ी जानी चाहिए।",
  ].filter(Boolean) as string[];

  return <InfoPageView page={{ title: "संपर्क करें", body: contactLines }} />;
}
