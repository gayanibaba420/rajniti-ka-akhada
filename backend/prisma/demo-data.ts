// Demo seed data — marked DEMO for migration
export const demoCategories = [
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
  "यह बदलाव केवल कागज़ी घोषणा तक सीमित नहीं है। प्रशासन ने संबंधित विभागों को समयबद्ध कार्ययोजना बनाने और हर सप्ताह प्रगति रिपोर्ट साझा करने के निर्देश दिए हैं।",
  "बैठक में नागरिक सुविधाओं, ग्रामीण संपर्क और युवाओं के लिए अवसर बढ़ाने पर विस्तार से चर्चा हुई।",
  "विशेषज्ञों का मानना है कि योजना की सफलता बजट के सही इस्तेमाल और जमीनी स्तर पर जवाबदेही पर निर्भर करेगी।",
];

export const demoArticles = [
  { slug: "haryana-assembly-development-session", title: "हरियाणा विधानसभा में विकास पर बड़ा मंथन, हिसार के लिए पांच नई परियोजनाओं को मंजूरी", excerpt: "सड़क, पानी और स्वास्थ्य सेवाओं पर केंद्रित योजनाओं से जिले के लाखों लोगों को सीधा लाभ मिलने की उम्मीद।", category: "haryana", location: "चंडीगढ़", breaking: true, featured: true, views: 1250, publishedAt: "2026-08-29T09:20:00+05:30", readTime: "3 मिनट", tags: ["हरियाणा", "चंडीगढ़", "ताज़ा खबर"] },
  { slug: "hisar-smart-roads-plan", title: "हिसार की 12 प्रमुख सड़कें होंगी स्मार्ट, रात में भी चलेगा काम", excerpt: "नगर निगम ने ट्रैफिक सुधार, साइकिल ट्रैक और बेहतर रोशनी के साथ नई कार्ययोजना जारी की।", category: "hisar", location: "हिसार", featured: true, views: 1567, publishedAt: "2026-08-28T10:20:00+05:30", readTime: "4 मिनट", tags: ["हिसार", "ताज़ा खबर"] },
  { slug: "farmers-digital-mandi", title: "किसानों के लिए डिजिटल मंडी सुविधा शुरू, घर बैठे मिलेगी भाव की सटीक जानकारी", excerpt: "हिसार मंडी का पायलट प्रोजेक्ट सात जिलों तक बढ़ाने की तैयारी।", category: "business", location: "हिसार", breaking: true, views: 1884, publishedAt: "2026-08-27T11:20:00+05:30", readTime: "5 मिनट", tags: ["कारोबार", "हिसार"] },
  { slug: "haryana-women-team-wins", title: "हरियाणा की बेटियों ने फिर रचा इतिहास, राष्ट्रीय प्रतियोगिता में जीते छह पदक", excerpt: "खिलाड़ियों के गांव लौटने पर हुआ भव्य स्वागत, सरकार ने पुरस्कार की घोषणा की।", category: "sports", location: "रोहतक", views: 2201, publishedAt: "2026-08-26T12:20:00+05:30", readTime: "6 मिनट", tags: ["खेल", "रोहतक"] },
  { slug: "village-water-project", title: "हर घर तक स्वच्छ पानी: 40 गांवों में नई पाइपलाइन का काम शुरू", excerpt: "गर्मी से पहले परियोजना पूरी करने का लक्ष्य, गुणवत्ता जांच के लिए स्वतंत्र टीम गठित।", category: "haryana", location: "भिवानी", views: 2518, publishedAt: "2026-08-25T13:20:00+05:30", readTime: "3 मिनट", tags: ["हरियाणा", "भिवानी"] },
  { slug: "hisar-university-admission", title: "हिसार विश्वविद्यालय में दाखिला कैलेंडर जारी, छात्रों के लिए हेल्प डेस्क", excerpt: "ऑनलाइन आवेदन अगले सोमवार से, आर्थिक रूप से कमजोर छात्रों को शुल्क में राहत।", category: "education", location: "हिसार", views: 2835, publishedAt: "2026-08-24T14:20:00+05:30", readTime: "4 मिनट", tags: ["शिक्षा", "हिसार"] },
  { slug: "parliament-policy-debate", title: "संसद में नई नीति पर चर्चा, सत्ता और विपक्ष ने रखे अपने तर्क", excerpt: "समिति की रिपोर्ट अगले सत्र में पेश होगी; नागरिक सुझाव भी मांगे गए।", category: "politics", location: "नई दिल्ली", views: 3152, publishedAt: "2026-08-23T15:20:00+05:30", readTime: "5 मिनट", tags: ["राजनीति", "नई दिल्ली"] },
  { slug: "india-green-energy", title: "हरित ऊर्जा में भारत की नई छलांग, छोटे शहरों में खुलेंगे रोजगार के अवसर", excerpt: "सौर उपकरण निर्माण को बढ़ावा देने के लिए नए प्रोत्साहन पैकेज का ऐलान।", category: "india", location: "नई दिल्ली", views: 3469, publishedAt: "2026-08-22T09:20:00+05:30", readTime: "6 मिनट", tags: ["देश", "नई दिल्ली"] },
  { slug: "global-climate-summit", title: "जलवायु सम्मेलन में साझा सहमति, विकासशील देशों के लिए विशेष कोष", excerpt: "नई रूपरेखा में तकनीकी सहयोग और आपदा राहत पर जोर दिया गया है।", category: "world", location: "जेनेवा", views: 3786, publishedAt: "2026-08-21T10:20:00+05:30", readTime: "3 मिनट", tags: ["दुनिया", "जेनेवा"] },
  { slug: "startup-hisar-language-ai", title: "हिसार के युवाओं का स्टार्टअप बनाएगा हिंदी में आसान एआई टूल", excerpt: "स्थानीय भाषाओं में सरकारी सेवाओं की जानकारी समझाने वाला प्लेटफॉर्म तैयार।", category: "technology", location: "हिसार", views: 4103, publishedAt: "2026-08-20T11:20:00+05:30", readTime: "4 मिनट", tags: ["टेक", "हिसार"] },
  { slug: "folk-festival-hisar", title: "लोक रंगों से सजा हिसार महोत्सव, कलाकारों ने जीता दर्शकों का दिल", excerpt: "तीन दिवसीय आयोजन में हरियाणवी संगीत, नाटक और हस्तशिल्प की धूम।", category: "entertainment", location: "हिसार", views: 4420, publishedAt: "2026-08-19T12:20:00+05:30", readTime: "5 मिनट", tags: ["मनोरंजन", "हिसार"] },
  { slug: "weather-crop-advisory", title: "मौसम बदलेगा करवट, कृषि वैज्ञानिकों ने किसानों के लिए जारी की सलाह", excerpt: "अगले 48 घंटों में हल्की बारिश की संभावना; सिंचाई रोकने का सुझाव।", category: "hisar", location: "हिसार", views: 4737, publishedAt: "2026-08-18T13:20:00+05:30", readTime: "6 मिनट", tags: ["हिसार", "ताज़ा खबर"] },
  { slug: "district-hospital-upgrade", title: "जिला अस्पताल में बढ़ेंगी 100 बेड की सुविधाएं, नई जांच मशीनें पहुंचीं", excerpt: "आपातकालीन वार्ड का विस्तार और ऑनलाइन अपॉइंटमेंट सेवा भी होगी शुरू।", category: "hisar", location: "हिसार", views: 5054, publishedAt: "2026-08-17T14:20:00+05:30", readTime: "3 मिनट", tags: ["हिसार", "ताज़ा खबर"] },
  { slug: "youth-sports-nursery", title: "हर ब्लॉक में खुलेगी खेल नर्सरी, ग्रामीण प्रतिभाओं को मिलेगा मंच", excerpt: "प्रशिक्षकों की भर्ती और उपकरण खरीद की प्रक्रिया अगले महीने से।", category: "sports", location: "हरियाणा", views: 5371, publishedAt: "2026-08-16T15:20:00+05:30", readTime: "4 मिनट", tags: ["खेल", "हरियाणा"] },
  { slug: "women-self-help-market", title: "स्वयं सहायता समूहों के उत्पादों को मिलेगा ऑनलाइन बाजार", excerpt: "प्रदेश की 12 हजार महिलाओं को प्रशिक्षण और पैकेजिंग सहायता।", category: "business", location: "हरियाणा", views: 5688, publishedAt: "2026-08-15T09:20:00+05:30", readTime: "5 मिनट", tags: ["कारोबार", "हरियाणा"] },
].map((a) => ({ ...a, content: body }));
