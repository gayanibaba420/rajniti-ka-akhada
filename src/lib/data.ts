export type Category = {
  slug: string;
  name: string;
  description: string;
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  location?: string;
  image: string;
  imageAlt: string;
  author: string;
  publishedAt: string;
  readTime: string;
  breaking?: boolean;
  featured?: boolean;
  views: number;
  content: string[];
  tags: string[];
};

export const categories: Category[] = [
  { slug: "haryana", name: "हरियाणा", description: "हरियाणा की राजनीति, प्रशासन और जनसरोकार की हर खबर" },
  { slug: "hisar", name: "हिसार", description: "हिसार शहर, गांव, मंडी और आसपास की स्थानीय खबरें" },
  { slug: "politics", name: "राजनीति", description: "सत्ता, विपक्ष और लोकतंत्र का निष्पक्ष विश्लेषण" },
  { slug: "india", name: "देश", description: "भारत की प्रमुख और विश्वसनीय खबरें" },
  { slug: "world", name: "दुनिया", description: "दुनिया भर से महत्वपूर्ण घटनाक्रम" },
  { slug: "sports", name: "खेल", description: "मैदान, खिलाड़ी और रिकॉर्ड की खबरें" },
  { slug: "business", name: "कारोबार", description: "बाजार, रोजगार, कृषि और अर्थव्यवस्था" },
  { slug: "education", name: "शिक्षा", description: "परीक्षा, दाखिले और करियर अपडेट" },
  { slug: "entertainment", name: "मनोरंजन", description: "सिनेमा, संगीत और संस्कृति" },
  { slug: "technology", name: "टेक", description: "तकनीक, स्टार्टअप और डिजिटल भारत" },
];

const body = [
  "यह बदलाव केवल कागज़ी घोषणा तक सीमित नहीं है। प्रशासन ने संबंधित विभागों को समयबद्ध कार्ययोजना बनाने और हर सप्ताह प्रगति रिपोर्ट साझा करने के निर्देश दिए हैं। स्थानीय प्रतिनिधियों का कहना है कि पारदर्शी निगरानी से काम की गुणवत्ता बेहतर होगी।",
  "बैठक में नागरिक सुविधाओं, ग्रामीण संपर्क और युवाओं के लिए अवसर बढ़ाने पर विस्तार से चर्चा हुई। अधिकारियों ने बताया कि प्राथमिकता वाले कामों की सूची सार्वजनिक पोर्टल पर उपलब्ध कराई जाएगी ताकि लोग सीधे प्रतिक्रिया दे सकें।",
  "विशेषज्ञों का मानना है कि योजना की सफलता बजट के सही इस्तेमाल और जमीनी स्तर पर जवाबदेही पर निर्भर करेगी। आने वाले दिनों में अलग-अलग क्षेत्रों में जनसंवाद आयोजित किए जाएंगे। हमारी टीम तथ्यों की पुष्टि के साथ हर अपडेट आप तक पहुंचाती रहेगी।",
];

const seed: Omit<Article, "content" | "tags" | "views" | "readTime" | "author" | "publishedAt">[] = [
  { slug: "haryana-assembly-development-session", title: "हरियाणा विधानसभा में विकास पर बड़ा मंथन, हिसार के लिए पांच नई परियोजनाओं को मंजूरी", excerpt: "सड़क, पानी और स्वास्थ्य सेवाओं पर केंद्रित योजनाओं से जिले के लाखों लोगों को सीधा लाभ मिलने की उम्मीद।", category: "haryana", location: "चंडीगढ़", image: "/news-assembly.svg", imageAlt: "हरियाणा विधानसभा का सांकेतिक चित्र", breaking: true, featured: true },
  { slug: "hisar-smart-roads-plan", title: "हिसार की 12 प्रमुख सड़कें होंगी स्मार्ट, रात में भी चलेगा काम", excerpt: "नगर निगम ने ट्रैफिक सुधार, साइकिल ट्रैक और बेहतर रोशनी के साथ नई कार्ययोजना जारी की।", category: "hisar", location: "हिसार", image: "/news-city.svg", imageAlt: "हिसार शहर का दृश्य", featured: true },
  { slug: "farmers-digital-mandi", title: "किसानों के लिए डिजिटल मंडी सुविधा शुरू, घर बैठे मिलेगी भाव की सटीक जानकारी", excerpt: "हिसार मंडी का पायलट प्रोजेक्ट सात जिलों तक बढ़ाने की तैयारी।", category: "business", location: "हिसार", image: "/news-farm.svg", imageAlt: "खेत में किसान और ट्रैक्टर", breaking: true },
  { slug: "haryana-women-team-wins", title: "हरियाणा की बेटियों ने फिर रचा इतिहास, राष्ट्रीय प्रतियोगिता में जीते छह पदक", excerpt: "खिलाड़ियों के गांव लौटने पर हुआ भव्य स्वागत, सरकार ने पुरस्कार की घोषणा की।", category: "sports", location: "रोहतक", image: "/news-sports.svg", imageAlt: "खेल मैदान में महिला खिलाड़ी" },
  { slug: "village-water-project", title: "हर घर तक स्वच्छ पानी: 40 गांवों में नई पाइपलाइन का काम शुरू", excerpt: "गर्मी से पहले परियोजना पूरी करने का लक्ष्य, गुणवत्ता जांच के लिए स्वतंत्र टीम गठित।", category: "haryana", location: "भिवानी", image: "/news-farm.svg", imageAlt: "हरियाणा का ग्रामीण क्षेत्र" },
  { slug: "hisar-university-admission", title: "हिसार विश्वविद्यालय में दाखिला कैलेंडर जारी, छात्रों के लिए हेल्प डेस्क", excerpt: "ऑनलाइन आवेदन अगले सोमवार से, आर्थिक रूप से कमजोर छात्रों को शुल्क में राहत।", category: "education", location: "हिसार", image: "/news-city.svg", imageAlt: "हिसार शहर और विश्वविद्यालय क्षेत्र" },
  { slug: "parliament-policy-debate", title: "संसद में नई नीति पर चर्चा, सत्ता और विपक्ष ने रखे अपने तर्क", excerpt: "समिति की रिपोर्ट अगले सत्र में पेश होगी; नागरिक सुझाव भी मांगे गए।", category: "politics", location: "नई दिल्ली", image: "/news-assembly.svg", imageAlt: "लोकतांत्रिक सदन का सांकेतिक चित्र" },
  { slug: "india-green-energy", title: "हरित ऊर्जा में भारत की नई छलांग, छोटे शहरों में खुलेंगे रोजगार के अवसर", excerpt: "सौर उपकरण निर्माण को बढ़ावा देने के लिए नए प्रोत्साहन पैकेज का ऐलान।", category: "india", location: "नई दिल्ली", image: "/news-city.svg", imageAlt: "आधुनिक भारतीय शहर" },
  { slug: "global-climate-summit", title: "जलवायु सम्मेलन में साझा सहमति, विकासशील देशों के लिए विशेष कोष", excerpt: "नई रूपरेखा में तकनीकी सहयोग और आपदा राहत पर जोर दिया गया है।", category: "world", location: "जेनेवा", image: "/news-assembly.svg", imageAlt: "अंतरराष्ट्रीय सम्मेलन का सांकेतिक चित्र" },
  { slug: "startup-hisar-language-ai", title: "हिसार के युवाओं का स्टार्टअप बनाएगा हिंदी में आसान एआई टूल", excerpt: "स्थानीय भाषाओं में सरकारी सेवाओं की जानकारी समझाने वाला प्लेटफॉर्म तैयार।", category: "technology", location: "हिसार", image: "/news-city.svg", imageAlt: "तकनीक से जुड़ा आधुनिक शहर" },
  { slug: "folk-festival-hisar", title: "लोक रंगों से सजा हिसार महोत्सव, कलाकारों ने जीता दर्शकों का दिल", excerpt: "तीन दिवसीय आयोजन में हरियाणवी संगीत, नाटक और हस्तशिल्प की धूम।", category: "entertainment", location: "हिसार", image: "/news-sports.svg", imageAlt: "सांस्कृतिक आयोजन का दृश्य" },
  { slug: "weather-crop-advisory", title: "मौसम बदलेगा करवट, कृषि वैज्ञानिकों ने किसानों के लिए जारी की सलाह", excerpt: "अगले 48 घंटों में हल्की बारिश की संभावना; सिंचाई रोकने का सुझाव।", category: "hisar", location: "हिसार", image: "/news-farm.svg", imageAlt: "बदलते मौसम में हरियाणा के खेत" },
  { slug: "district-hospital-upgrade", title: "जिला अस्पताल में बढ़ेंगी 100 बेड की सुविधाएं, नई जांच मशीनें पहुंचीं", excerpt: "आपातकालीन वार्ड का विस्तार और ऑनलाइन अपॉइंटमेंट सेवा भी होगी शुरू।", category: "hisar", location: "हिसार", image: "/news-city.svg", imageAlt: "हिसार का शहरी क्षेत्र" },
  { slug: "youth-sports-nursery", title: "हर ब्लॉक में खुलेगी खेल नर्सरी, ग्रामीण प्रतिभाओं को मिलेगा मंच", excerpt: "प्रशिक्षकों की भर्ती और उपकरण खरीद की प्रक्रिया अगले महीने से।", category: "sports", location: "हरियाणा", image: "/news-sports.svg", imageAlt: "हरियाणा में खेल प्रशिक्षण" },
  { slug: "women-self-help-market", title: "स्वयं सहायता समूहों के उत्पादों को मिलेगा ऑनलाइन बाजार", excerpt: "प्रदेश की 12 हजार महिलाओं को प्रशिक्षण और पैकेजिंग सहायता।", category: "business", location: "हरियाणा", image: "/news-farm.svg", imageAlt: "हरियाणा का ग्रामीण उद्यम" },
];

export const articles: Article[] = seed.map((article, index) => ({
  ...article,
  author: index % 3 === 0 ? "साक्षी दहिया" : index % 3 === 1 ? "अमित मलिक" : "न्यूज़ डेस्क",
  publishedAt: `2026-08-${String(29 - (index % 8)).padStart(2, "0")}T${String(9 + (index % 6)).padStart(2, "0")}:20:00+05:30`,
  readTime: `${3 + (index % 4)} मिनट`,
  views: 1250 + index * 317,
  content: body,
  tags: [categories.find((c) => c.slug === article.category)?.name ?? "समाचार", article.location ?? "भारत", "ताज़ा खबर"],
}));

export const getArticle = (slug: string) => articles.find((article) => article.slug === slug);
export const getCategory = (slug: string) => categories.find((category) => category.slug === slug);
export const getByCategory = (slug: string) => articles.filter((article) => article.category === slug);
export const getRelated = (article: Article) =>
  articles.filter((item) => item.slug !== article.slug && (item.category === article.category || item.location === article.location)).slice(0, 4);

export const siteConfig = {
  name: "राजनीति का अखाड़ा",
  tagline: "हिंदी समाचार • निष्पक्ष विचार",
  description: "हरियाणा, हिसार, राजनीति और देश-दुनिया की विश्वसनीय हिंदी खबरें।",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:43127",
  email: "sampark@rajnitikaakhada.in",
};
