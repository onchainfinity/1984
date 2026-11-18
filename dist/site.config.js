// Public editorial configuration for the released single and its music video.
export const siteConfig = Object.freeze({
  defaultLocale: "fr",
  // Alphabetical by French language name; the menu displays native names.
  locales: ["en", "zh", "ko", "es", "fr", "ja", "pt"],
  youtubeUrl: "https://youtu.be/w_qzkKN237k",
  audioDuration: 333.36,
  videoDuration: 336.375,
  canonicalUrl: "https://onchainfinity.art/1984/",
});

export const localeMetadata = Object.freeze({
  en: { name: "English", tag: "en", og: "en_GB" },
  zh: { name: "中文（简体）", tag: "zh-Hans", og: "zh_CN" },
  ko: { name: "한국어", tag: "ko", og: "ko_KR" },
  es: { name: "Español", tag: "es", og: "es_ES" },
  fr: { name: "Français", tag: "fr", og: "fr_FR" },
  ja: { name: "日本語", tag: "ja", og: "ja_JP" },
  pt: { name: "Português", tag: "pt", og: "pt_PT" },
});
