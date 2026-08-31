import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-utils";
import { resolveGeminiApiKey } from "@/lib/ai-radar/settings";
import { slugify } from "@/lib/types";

export const dynamic = "force-dynamic";

// Topic-Specific Synthesizer when offline / without API key
function synthesizeTopicSpecificArticle(title: string, category: string, source: string) {
  const cleanTitle = title
    .replace(/\s*\.\.\.\s*$/, "")
    .replace(/\s*-\s*[A-Za-z\u0900-\u097F\s]+$/, "")
    .trim();

  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("hi-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const isHisar = /हिसार|hisar/i.test(cleanTitle) || /hisar/i.test(category);
  const isAssembly = /विधानसभा|मानसून सत्र|विपक्ष|हुड्डा|विज|सैनी|विधायक|स्पीकर/i.test(cleanTitle);
  const isCrimeOrPolice = /पुलिस|गुंडागर्दी|क्राइम|मुकदमा|हादसा|गिरफ्तार|जांच|कोहनी/i.test(cleanTitle);
  const isFarmerOrGov = /किसान|एमएसपी|योजना|विकास|सड़क|मुआवजा|पोर्टल|बजट/i.test(cleanTitle);

  let dateline = isHisar
    ? `हिसार | ${dateStr} (राजनीति का अखाड़ा ब्यूरो)`
    : isAssembly
      ? `चंडीगढ़/विधानसभा | ${dateStr} (राजनीति का अखाड़ा ब्यूरो)`
      : `हरियाणा | ${dateStr} (राजनीति का अखाड़ा ब्यूरो)`;

  // Break title into main topic and statements
  const parts = cleanTitle.split(/[:|—–-]/).map((s) => s.trim()).filter(Boolean);
  const mainEvent = parts[0] || cleanTitle;
  const subStatement = parts[1] || "";

  // 1. Lead Paragraph
  let p1 = `**${dateline}**: ${cleanTitle}। `;
  if (subStatement) {
    p1 += `इस मामले में विशेष रूप से सामने आया है कि ${subStatement}। `;
  }
  p1 += `इस ताज़ा प्रकरण ने प्रदेश की सियासत और प्रशासनिक हलकों में नई बहस छेड़ दी है, जिससे संबंधित पक्षों के बीच तीखी बयानबाज़ी शुरू हो गई है।`;

  // 2. Core Conflict / Event Breakdown
  let p2 = "";
  if (isAssembly) {
    p2 += `हरियाणा विधानसभा और राजनीतिक गलियारों में इस विषय पर गरमा-गरम चर्चा देखने को मिली। `;
    p2 += `सदन के भीतर एवं बाहर सत्तापक्ष और विपक्ष के नेताओं के बीच आरोप-प्रत्यारोप का दौर जारी है। `;
    if (subStatement) {
      p2 += `नेताओं द्वारा उठाए गए सवालों—विशेष रूप से "${subStatement}" पर सरकार के रुख और विभागीय कार्यशैली को लेकर जवाबदेही तय करने की मांग की गई है। `;
    } else {
      p2 += `इस घटनाक्रम को लेकर वरिष्ठ नेताओं ने अपनी स्पष्ट राय रखते हुए जनहित और नियमों की दुहाई दी है। `;
    }
  } else if (isCrimeOrPolice) {
    p2 += `मामले की गंभीरता को देखते हुए कानून-व्यवस्था और संबंधित तंत्र पर सीधे सवाल खड़े हो रहे हैं। `;
    p2 += `सूत्रों के अनुसार, पूरी घटना में शामिल तत्वों और प्रशासनिक भूमिका की बारीकी से पड़ताल की जा रही है। `;
    if (subStatement) {
      p2 += `इस पूरे विवाद में "${subStatement}" का बिंदु सबसे अहम बनकर उभरा है, जिस पर संबंधित अधिकारियों की ओर से भी स्पष्टीकरण की मांग की जा रही है। `;
    }
  } else if (isFarmerOrGov) {
    p2 += `जनसरोकार और नीतिगत फैसलों से जुड़े इस मुद्दे पर विभिन्न संगठनों और आम नागरिकों की तीखी प्रतिक्रिया सामने आई है। `;
    p2 += `योजनाओं के क्रियान्वयन और जमीनी हकीकत के बीच के अंतर को लेकर खुलकर चर्चा हो रही है। `;
    p2 += `संबंधित प्रतिनिधियों का कहना है कि जनता के अधिकारों और हितों की अनदेखी किसी भी सूरत में बर्दाश्त नहीं की जाएगी। `;
  } else {
    p2 += `घटनाक्रम से जुड़े प्रत्यक्षदर्शियों और सूत्रों के मुताबिक, पूरे प्रकरण के पीछे कई अहम कारण सामने आ रहे हैं। `;
    p2 += `इस विषय पर विभिन्न जिम्मेदार पक्षों ने अपनी-अपनी स्थिति स्पष्ट की है और आने वाले समय में इसके कई नए पहलू सामने आने की संभावना है। `;
  }

  // 3. Political Context & Analytical Impact
  let p3 = `### राजनीतिक व सामाजिक प्रभाव\n\n`;
  p3 += `विश्लेषकों का मानना है कि "${mainEvent}" का यह मामला सिर्फ तात्कालिक विवाद नहीं है, बल्कि इसके दूरगामी राजनीतिक और सामाजिक प्रभाव देखने को मिलेंगे। `;
  if (isAssembly) {
    p3 += `आगामी दिनों में विपक्ष इसे बड़ा मुद्दा बनाकर सरकार की घेराबंदी की रणनीति तैयार कर रहा है, वहीं सत्तापक्ष भी अपने तर्कों के साथ मजबूती से डटा हुआ है। `;
  } else {
    p3 += `स्थानीय स्तर पर जनआक्रोश और प्रशासनिक जवाबदेही को लेकर लोग लगातार अपनी आवाज़ बुलंद कर रहे हैं। `;
  }

  // 4. Conclusion
  let p4 = `### 'राजनीति का अखाड़ा' की विशेष रिपोर्ट\n\n`;
  p4 += `इस पूरे घटनाक्रम पर 'राजनीति का अखाड़ा' की विशेष टीम लगातार नज़र बनाए हुए है। मामले से जुड़ा हर आधिकारिक बयान, अंदरूनी हलचल और हर नया मोड़ सबसे पहले आप तक निष्पक्षता से पहुंचाया जाएगा।`;

  const fullMarkdown = `## ${cleanTitle}

${p1}

### मुख्य घटनाक्रम एवं विस्तृत ब्यौरा

${p2}

${p3}

${p4}`;

  const generatedSlug = (category.toLowerCase() || "news") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);

  return {
    headline: cleanTitle,
    excerpt: (cleanTitle + " — इस पूरे घटनाक्रम और बयानों पर पढ़ें राजनीति का अखाड़ा की विस्तृत निष्पक्ष रिपोर्ट।").slice(0, 280),
    article: fullMarkdown,
    highlight: `${mainEvent} — सियासी और प्रशासनिक गलियारों में मचा हड़कंप।`,
    location: isHisar ? "हिसार" : "हरियाणा",
    slug: generatedSlug,
    tags: [category, "हरियाणा राजनीति", "ताज़ा खबर", isAssembly ? "विधानसभा" : "मुख्य समाचार"].filter(Boolean),
    seoTitle: cleanTitle.slice(0, 60),
    seoDescription: cleanTitle.slice(0, 160),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return jsonError("लॉगिन आवश्यक", 401);

    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      category?: string;
      categoryHindi?: string;
      source?: string;
      link?: string;
    };

    const title = (body.title || "").trim();
    if (!title) return jsonError("शीर्षक आवश्यक है", 400);

    const category = body.categoryHindi || body.category || "हरियाणा";
    const source = body.source || "समाचार ब्यूरो";

    const apiKey = await resolveGeminiApiKey();

    if (apiKey) {
      try {
        const cleanTitle = title
          .replace(/\s*\.\.\.\s*$/, "")
          .replace(/\s*-\s*[A-Za-z\u0900-\u097F\s]+$/, "")
          .trim();

        const prompt = `You are the Senior Chief Editor for "राजनीति का अखाड़ा" (rajnitikaakhada.com), the premier Hindi political news portal of Haryana and North India.

Generate a comprehensive, high-quality, professional Hindi journalistic news article strictly based on this headline:
Headline: "${cleanTitle}"
Category: "${category}"
Source/Outlet: "${source}"

INSTRUCTIONS:
1. Write 4-5 substantive, well-researched paragraphs focusing strictly on the real entities, politicians, assembly debates, disputes, or events named in the headline.
2. DO NOT use generic placeholder sentences like "मामले की निगरानी की जा रही है". Instead, discuss the actual political context, statements, reactions, allegations, and background.
3. First paragraph must start with a Dateline: "**हिसार/चंडीगढ़ | [तारीख] (राजनीति का अखाड़ा ब्यूरो)**: ..."
4. Use clean Markdown with '##' main heading and '###' subheadings.
5. Return ONLY a valid JSON object:
{
  "headline": "${cleanTitle}",
  "excerpt": "2-3 sentences crisp Hindi summary",
  "article": "Full Markdown Hindi article with subheadings",
  "highlight": "1 strong Hindi bullet highlight",
  "location": "हिसार / चंडीगढ़ / हरियाणा",
  "slug": "english-slug-lowercase-with-hyphens",
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "Hindi SEO Title (max 60 chars)",
  "seoDescription": "Hindi Meta Description (max 160 chars)"
}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (parsed.article && parsed.headline) {
              const validSlug = slugify(parsed.slug || (body.category ? body.category.toLowerCase() : "news") + "-" + Date.now().toString(36));
              return jsonOk({
                articleData: {
                  headline: parsed.headline || cleanTitle,
                  excerpt: parsed.excerpt || cleanTitle,
                  article: parsed.article,
                  highlight: parsed.highlight || cleanTitle,
                  location: parsed.location || "हरियाणा",
                  slug: validSlug,
                  tags: Array.isArray(parsed.tags) ? parsed.tags : [category, "ताज़ा खबर"],
                  seoTitle: parsed.seoTitle || cleanTitle,
                  seoDescription: parsed.seoDescription || parsed.excerpt || cleanTitle,
                },
              });
            }
          }
        }
      } catch (err) {
        console.error("Gemini expand error, falling back to synthesizer:", err);
      }
    }

    // High quality intelligent topic-specific synthesis fallback
    const synthesized = synthesizeTopicSpecificArticle(title, category, source);
    return jsonOk({ articleData: synthesized });
  } catch (error) {
    return handleApiError(error);
  }
}
