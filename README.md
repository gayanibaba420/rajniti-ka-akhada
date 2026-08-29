# राजनीति का अखाड़ा

“हिंदी समाचार • निष्पक्ष विचार” — हरियाणा और हिसार केंद्रित, मोबाइल-फर्स्ट हिंदी डिजिटल न्यूज़ पोर्टल का पूर्ण डेमो। Next.js App Router, TypeScript, Tailwind CSS और स्थानीय SVG संपादकीय विज़ुअल पर निर्मित।

## फीचर

- प्रीमियम होमपेज: ब्रेकिंग टिकर, लीड स्टोरी, लाइव अपडेट, हिसार स्पेशल, हरियाणा और सभी प्रमुख श्रेणियां
- श्रेणी, लेख और खोज रूट; फिल्टर, पेजिनेशन, खाली/लोडिंग/error/404 अवस्थाएं
- लेख में metadata, शेयर/सेव, हाइलाइट, लेखक, टैग, टिप्पणी डेमो, संबंधित और विज्ञापन स्लॉट
- पूर्ण CMS डेमो: आंकड़े, पोस्ट सूची/एडिटर, मीडिया लाइब्रेरी, ब्रेकिंग, लेखक/भूमिका, टिप्पणी, विज्ञापन, SEO और सेटिंग्स
- persisted dark mode, responsive navigation, keyboard focus, semantic HTML और reduced-motion समर्थन
- SEO: canonical, Open Graph, Twitter, NewsArticle/Breadcrumb/Organization JSON-LD, sitemap, robots और RSS
- typed content repository interface, Zod validation और sanitization pattern

सभी समाचार और आंकड़े स्पष्ट रूप से डेमो सामग्री हैं। कोई बाहरी/hotlinked इमेज नहीं है।

## स्थानीय विकास

Node.js 20.9+ आवश्यक है।

```bash
npm ci
cp .env.example .env.local
npm run dev -- --hostname 0.0.0.0 --port 43127
```

फिर `http://localhost:43127` खोलें। गुणवत्ता जांच:

```bash
npm run lint
npm run typecheck
npm run build
```

## पर्यावरण चर

| नाम | उपयोग |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | canonical, sitemap, RSS और JSON-LD का सार्वजनिक origin; trailing slash के बिना |
| `ADMIN_USER` | Basic Auth डेमो उपयोगकर्ता |
| `ADMIN_PASSWORD` | लंबा random secret; source control में कभी न रखें |

विकास में दोनों admin चर न होने पर `/admin` खुला रहता है ताकि UI का मूल्यांकन हो सके। production में middleware **fail closed** करता है और अनुपस्थित credentials पर 503 देता है। दोनों सेट होने पर browser Basic Auth challenge मिलता है।

## CMS डेमो

`/admin` पर dashboard और सभी संपादकीय अनुभाग उपलब्ध हैं। पोस्ट बनाना, status बदलना, मीडिया चुनना, टिप्पणी/breaking toggles और settings save स्थानीय UI interactions हैं; refresh पर reset होते हैं। `src/lib/content-service.ts` में storage-agnostic repository contract और validated input schema है, इसलिए PostgreSQL/SQL adapter को UI/data contracts बदले बिना जोड़ा जा सकता है।

### उत्पादन सुरक्षा चेकलिस्ट

यह client-side CMS persistence उत्पादन सुरक्षा नहीं है। लाइव करने से पहले:

1. Basic Auth को Auth.js/विश्वसनीय OIDC SSO और server-side sessions से बदलें; MFA, session rotation और CSRF protection लागू करें।
2. हर mutation को Route Handler/Server Action पर role (`admin`, `editor`, `reporter`, `moderator`) और ownership के साथ authorize करें। UI visibility को authorization न मानें।
3. PostgreSQL जैसे डेटाबेस में migration, constraints, revision history, soft delete और immutable audit log जोड़ें।
4. rich text को server पर allowlist sanitizer से साफ करें; parameterized queries और rate limits लगाएं।
5. मीडिया को private signed-upload flow, MIME/magic-byte जांच, size limits, malware scan और image re-encoding के बाद object storage/CDN में रखें।
6. comments में abuse/spam detection, moderation queue और privacy-compliant IP retention लगाएं।
7. secrets केवल deployment secret manager में रखें; CSP, HSTS और production observability/alerts जोड़ें।

## डिप्लॉयमेंट और डोमेन

Vercel पर repository import करें या किसी Node host पर:

```bash
npm ci
npm run build
npm start -- --hostname 0.0.0.0 --port 3000
```

Deployment panel में ऊपर के environment variables सेट करें। Custom domain का DNS provider के निर्देशानुसार `A`/`CNAME` record जोड़ें, HTTPS सक्रिय होने के बाद `NEXT_PUBLIC_SITE_URL=https://आपका-डोमेन` सेट करके फिर deploy करें। Reverse proxy उपयोग करते समय original HTTPS host सुरक्षित रखें। CDN पर `/_next/static` immutable cache हो सकता है; HTML/RSS को origin के cache headers के अनुसार रखें।

## संरचना

- `src/lib/data.ts` — typed demo domain data और selectors
- `src/lib/content-service.ts` — database-ready repository/validation boundary
- `src/components` — reusable shell, ticker, cards, ads और article interactions
- `src/app/category/[slug]`, `article/[slug]`, `search` — सार्वजनिक routes
- `src/app/admin` — interactive CMS demonstration
- `src/proxy.ts` — protected admin route boundary

## संपादकीय/तकनीकी नोट

Noto Sans Devanagari को `next/font` subset और font swapping के साथ self-hosted build asset में बदला जाता है। स्थानीय SVG assets `next/image` से optimized layout में render होते हैं। वास्तविक newsroom में publication timezone, legal pages, corrections workflow, News sitemap और analytics consent को संगठन की नीति के अनुसार कॉन्फ़िगर करें।
