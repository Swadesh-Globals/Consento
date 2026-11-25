import type { LanguageContent, LanguagePack } from "@consent/schemas";
import { day, now, tenants } from "./index";

/**
 * CFG-11 language packs: principal-facing content (banner, notice, privacy policy) per language.
 * The console UI itself is English only. Synthetic text; en, hi and kn are written, others not yet added.
 */
type Copy = { banner: LanguageContent["banner"]; notice: string; privacyPolicy: string };
type Fill = (org: string, slug: string) => Copy;

const copy: Record<string, Fill> = {
  en: (org, slug) => ({
    banner: {
      title: "Your privacy choices",
      body: `${org} uses your data for the purposes below. Choose what you allow. You can withdraw at any time from the privacy link in the footer.`,
      acceptLabel: "Accept all",
      rejectLabel: "Reject all",
      customiseLabel: "Choose purposes",
    },
    notice: `Notice from ${org}\n\nWe process your personal data only for the purposes you select below. For each purpose we list the data used and how long we keep it.\n\nYou can withdraw consent at any time from the privacy link. You can complain to our Data Protection Officer or to the Data Protection Board of India.`,
    privacyPolicy: [
      `Privacy policy — ${org}`,
      `1. Who we are\n${org} is the Data Fiduciary for the personal data described here. Contact our Data Protection Officer at dpo@${slug}.example.in.`,
      "2. What we collect and why\nWe collect only the data needed for the purposes you consent to, such as order fulfilment, customer support and, if you agree, marketing.",
      "3. Your consent\nYou can give, review or withdraw consent at any time from the privacy link in our website footer. Withdrawing is as easy as giving consent.",
      "4. Your rights\nUnder the Digital Personal Data Protection Act 2023 you can ask for a summary of your data, correction, completion or erasure, and nominate someone to act for you.",
      "5. Retention\nWe erase your data when its purpose is complete or consent is withdrawn, unless the law requires us to keep it. We tell you 48 hours before erasure.",
      "6. Grievances\nIf you are unhappy with how we handle your data, contact our DPO. If it is not resolved, you can complain to the Data Protection Board of India.",
    ].join("\n\n"),
  }),
  hi: (org, slug) => ({
    banner: {
      title: "आपकी गोपनीयता के विकल्प",
      body: `${org} नीचे दिए गए उद्देश्यों के लिए आपके डेटा का उपयोग करता है। चुनें कि आप क्या अनुमति देते हैं। आप फ़ुटर में गोपनीयता लिंक से कभी भी सहमति वापस ले सकते हैं।`,
      acceptLabel: "सभी स्वीकार करें",
      rejectLabel: "सभी अस्वीकार करें",
      customiseLabel: "उद्देश्य चुनें",
    },
    notice: `${org} की सूचना\n\nहम आपके व्यक्तिगत डेटा का उपयोग केवल उन्हीं उद्देश्यों के लिए करते हैं जिन्हें आप नीचे चुनते हैं। हर उद्देश्य के लिए हम बताते हैं कि कौन सा डेटा उपयोग होता है और उसे कितने समय तक रखा जाता है।\n\nआप गोपनीयता लिंक से कभी भी सहमति वापस ले सकते हैं। आप हमारे डेटा संरक्षण अधिकारी या भारतीय डेटा संरक्षण बोर्ड से शिकायत कर सकते हैं।`,
    privacyPolicy: [
      `गोपनीयता नीति — ${org}`,
      `1. हम कौन हैं\n${org} यहाँ बताए गए व्यक्तिगत डेटा का डेटा फ़िड्यूशियरी है। हमारे डेटा संरक्षण अधिकारी से dpo@${slug}.example.in पर संपर्क करें।`,
      "2. हम क्या एकत्र करते हैं और क्यों\nहम केवल वही डेटा एकत्र करते हैं जो उन उद्देश्यों के लिए आवश्यक है जिनके लिए आप सहमति देते हैं, जैसे ऑर्डर पूरा करना, ग्राहक सहायता और, यदि आप सहमत हों, मार्केटिंग।",
      "3. आपकी सहमति\nआप हमारी वेबसाइट के फ़ुटर में गोपनीयता लिंक से कभी भी सहमति दे सकते हैं, देख सकते हैं या वापस ले सकते हैं। सहमति वापस लेना उतना ही आसान है जितना देना।",
      "4. आपके अधिकार\nडिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 के तहत आप अपने डेटा का सारांश, सुधार, पूर्णता या मिटाने का अनुरोध कर सकते हैं, और अपनी ओर से कार्य करने के लिए किसी को नामित कर सकते हैं।",
      "5. डेटा प्रतिधारण\nउद्देश्य पूरा होने या सहमति वापस लेने पर हम आपका डेटा मिटा देते हैं, जब तक कि कानून इसे रखने की आवश्यकता न रखे। मिटाने से 48 घंटे पहले हम आपको सूचित करते हैं।",
      "6. शिकायतें\nयदि आप हमारे डेटा प्रबंधन से संतुष्ट नहीं हैं, तो हमारे डीपीओ से संपर्क करें। समाधान न होने पर आप भारतीय डेटा संरक्षण बोर्ड में शिकायत कर सकते हैं।",
    ].join("\n\n"),
  }),
  kn: (org, slug) => ({
    banner: {
      title: "ನಿಮ್ಮ ಗೌಪ್ಯತಾ ಆಯ್ಕೆಗಳು",
      body: `${org} ಕೆಳಗಿನ ಉದ್ದೇಶಗಳಿಗಾಗಿ ನಿಮ್ಮ ದತ್ತಾಂಶವನ್ನು ಬಳಸುತ್ತದೆ. ನೀವು ಏನನ್ನು ಅನುಮತಿಸುತ್ತೀರಿ ಎಂಬುದನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಕೆಳಭಾಗದ ಗೌಪ್ಯತಾ ಲಿಂಕ್ ಮೂಲಕ ಯಾವಾಗ ಬೇಕಾದರೂ ಒಪ್ಪಿಗೆ ಹಿಂಪಡೆಯಬಹುದು.`,
      acceptLabel: "ಎಲ್ಲವನ್ನೂ ಸ್ವೀಕರಿಸಿ",
      rejectLabel: "ಎಲ್ಲವನ್ನೂ ತಿರಸ್ಕರಿಸಿ",
      customiseLabel: "ಉದ್ದೇಶಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    },
    notice: `${org} ಸೂಚನೆ\n\nನೀವು ಕೆಳಗೆ ಆಯ್ಕೆಮಾಡುವ ಉದ್ದೇಶಗಳಿಗೆ ಮಾತ್ರ ನಾವು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ದತ್ತಾಂಶವನ್ನು ಬಳಸುತ್ತೇವೆ. ಪ್ರತಿ ಉದ್ದೇಶಕ್ಕೆ ಬಳಸುವ ದತ್ತಾಂಶ ಮತ್ತು ಅದನ್ನು ಎಷ್ಟು ಕಾಲ ಇರಿಸುತ್ತೇವೆ ಎಂಬುದನ್ನು ತಿಳಿಸುತ್ತೇವೆ.\n\nಗೌಪ್ಯತಾ ಲಿಂಕ್ ಮೂಲಕ ಯಾವಾಗ ಬೇಕಾದರೂ ಒಪ್ಪಿಗೆ ಹಿಂಪಡೆಯಬಹುದು. ನಮ್ಮ ದತ್ತಾಂಶ ಸಂರಕ್ಷಣಾ ಅಧಿಕಾರಿ ಅಥವಾ ಭಾರತದ ದತ್ತಾಂಶ ಸಂರಕ್ಷಣಾ ಮಂಡಳಿಗೆ ದೂರು ನೀಡಬಹುದು.`,
    privacyPolicy: [
      `ಗೌಪ್ಯತಾ ನೀತಿ — ${org}`,
      `1. ನಾವು ಯಾರು\n${org} ಇಲ್ಲಿ ವಿವರಿಸಿದ ವೈಯಕ್ತಿಕ ದತ್ತಾಂಶದ ಡೇಟಾ ಫಿಡ್ಯೂಶಿಯರಿ ಆಗಿದೆ. ನಮ್ಮ ದತ್ತಾಂಶ ಸಂರಕ್ಷಣಾ ಅಧಿಕಾರಿಯನ್ನು dpo@${slug}.example.in ನಲ್ಲಿ ಸಂಪರ್ಕಿಸಿ.`,
      "2. ನಾವು ಏನು ಸಂಗ್ರಹಿಸುತ್ತೇವೆ ಮತ್ತು ಏಕೆ\nನೀವು ಒಪ್ಪಿಗೆ ನೀಡುವ ಉದ್ದೇಶಗಳಿಗೆ ಅಗತ್ಯವಿರುವ ದತ್ತಾಂಶವನ್ನು ಮಾತ್ರ ನಾವು ಸಂಗ್ರಹಿಸುತ್ತೇವೆ, ಉದಾಹರಣೆಗೆ ಆರ್ಡರ್ ಪೂರೈಕೆ, ಗ್ರಾಹಕ ಬೆಂಬಲ ಮತ್ತು ನೀವು ಒಪ್ಪಿದರೆ ಮಾರುಕಟ್ಟೆ ಸಂದೇಶಗಳು.",
      "3. ನಿಮ್ಮ ಒಪ್ಪಿಗೆ\nನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನ ಕೆಳಭಾಗದ ಗೌಪ್ಯತಾ ಲಿಂಕ್ ಮೂಲಕ ನೀವು ಯಾವಾಗ ಬೇಕಾದರೂ ಒಪ್ಪಿಗೆ ನೀಡಬಹುದು, ಪರಿಶೀಲಿಸಬಹುದು ಅಥವಾ ಹಿಂಪಡೆಯಬಹುದು. ಒಪ್ಪಿಗೆ ಹಿಂಪಡೆಯುವುದು ನೀಡುವಷ್ಟೇ ಸುಲಭ.",
      "4. ನಿಮ್ಮ ಹಕ್ಕುಗಳು\nಡಿಜಿಟಲ್ ವೈಯಕ್ತಿಕ ದತ್ತಾಂಶ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ 2023 ರ ಅಡಿಯಲ್ಲಿ ನಿಮ್ಮ ದತ್ತಾಂಶದ ಸಾರಾಂಶ, ತಿದ್ದುಪಡಿ, ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಅಥವಾ ಅಳಿಸುವಿಕೆಯನ್ನು ಕೇಳಬಹುದು ಮತ್ತು ನಿಮ್ಮ ಪರವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸಲು ಒಬ್ಬರನ್ನು ನಾಮನಿರ್ದೇಶನ ಮಾಡಬಹುದು.",
      "5. ದತ್ತಾಂಶ ಸಂಗ್ರಹಣಾ ಅವಧಿ\nಉದ್ದೇಶ ಪೂರ್ಣಗೊಂಡಾಗ ಅಥವಾ ಒಪ್ಪಿಗೆ ಹಿಂಪಡೆದಾಗ, ಕಾನೂನು ಇರಿಸಿಕೊಳ್ಳಲು ಸೂಚಿಸದ ಹೊರತು, ನಾವು ನಿಮ್ಮ ದತ್ತಾಂಶವನ್ನು ಅಳಿಸುತ್ತೇವೆ. ಅಳಿಸುವ 48 ಗಂಟೆಗಳ ಮೊದಲು ನಿಮಗೆ ತಿಳಿಸುತ್ತೇವೆ.",
      "6. ದೂರುಗಳು\nನಾವು ನಿಮ್ಮ ದತ್ತಾಂಶವನ್ನು ನಿರ್ವಹಿಸುವ ರೀತಿಯಿಂದ ನಿಮಗೆ ತೃಪ್ತಿ ಇಲ್ಲದಿದ್ದರೆ ನಮ್ಮ ಡಿಪಿಒ ಅವರನ್ನು ಸಂಪರ್ಕಿಸಿ. ಪರಿಹಾರವಾಗದಿದ್ದರೆ ಭಾರತದ ದತ್ತಾಂಶ ಸಂರಕ್ಷಣಾ ಮಂಡಳಿಗೆ ದೂರು ನೀಡಬಹುದು.",
    ].join("\n\n"),
  }),
};

/** English + all 22 Eighth Schedule languages (BCP 47 codes). Perso-Arabic scripts (Kashmiri, Sindhi, Urdu) are rtl. */
const langs: Array<[code: string, name: string, dir: "ltr" | "rtl"]> = [
  ["en", "English", "ltr"],
  ["as", "অসমীয়া Assamese", "ltr"],
  ["bn", "বাংলা Bengali", "ltr"],
  ["brx", "बड़ो Bodo", "ltr"],
  ["doi", "डोगरी Dogri", "ltr"],
  ["gu", "ગુજરાતી Gujarati", "ltr"],
  ["hi", "हिन्दी Hindi", "ltr"],
  ["kn", "ಕನ್ನಡ Kannada", "ltr"],
  ["ks", "کٲشُر Kashmiri", "rtl"],
  ["kok", "कोंकणी Konkani", "ltr"],
  ["mai", "मैथिली Maithili", "ltr"],
  ["ml", "മലയാളം Malayalam", "ltr"],
  ["mni", "ꯃꯤꯇꯩꯂꯣꯟ Manipuri", "ltr"],
  ["mr", "मराठी Marathi", "ltr"],
  ["ne", "नेपाली Nepali", "ltr"],
  ["or", "ଓଡ଼ିଆ Odia", "ltr"],
  ["pa", "ਪੰਜਾਬੀ Punjabi", "ltr"],
  ["sa", "संस्कृतम् Sanskrit", "ltr"],
  ["sat", "ᱥᱟᱱᱛᱟᱲᱤ Santali", "ltr"],
  ["sd", "سنڌي Sindhi", "rtl"],
  ["ta", "தமிழ் Tamil", "ltr"],
  ["te", "తెలుగు Telugu", "ltr"],
  ["ur", "اردو Urdu", "rtl"],
];

const empty: Copy = { banner: { title: "", body: "", acceptLabel: "", rejectLabel: "", customiseLabel: "" }, notice: "", privacyPolicy: "" };
const key = (slug: string, code: string) => `${slug}:${code}`;
const onboarding = "hello-llp";

export const languagePacks: Array<LanguagePack & { tenantSlug: string }> = [];
export const languageContent = new Map<string, LanguageContent>();

for (const t of tenants) {
  for (const [code, name, dir] of langs) {
    const fill = copy[code];
    const status: LanguagePack["notice"] = !fill ? "missing" : code === "en" || t.slug !== onboarding ? "approved" : "draft";
    languagePacks.push({
      tenantSlug: t.slug,
      code,
      name,
      dir,
      notice: status,
      banner: status,
      privacyPolicy: status,
      translatedPct: { approved: 100, in_review: 92, draft: 60, missing: 0 }[status],
      reviewer: status === "approved" ? (code === "en" ? "Oliver Bennett" : "Bhashini draft + Oliver Bennett") : null,
    });
    languageContent.set(key(t.slug, code), {
      code,
      name,
      dir,
      ...(fill ? fill(t.name, t.slug) : empty),
      updatedAt: fill ? new Date(now - (code === "en" ? 40 : 12) * day).toISOString() : null,
    });
  }
}

export const contentKey = key;
