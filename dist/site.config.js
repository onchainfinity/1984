// Public editorial configuration for the released single and its music video.
export const siteConfig = Object.freeze({
  defaultLocale: "fr",
  locales: ["fr", "en", "ko", "zh", "ja", "es", "pt"],
  youtubeUrl: "https://youtu.be/w_qzkKN237k",
  audioDuration: 333.36,
  videoDuration: 336.375,
  canonicalUrl: "https://onchainfinity.art/1984/",
});

export const localeMetadata = Object.freeze({
  fr: { name: "Français", tag: "fr", og: "fr_FR" },
  en: { name: "English", tag: "en", og: "en_GB" },
  ko: { name: "한국어", tag: "ko", og: "ko_KR" },
  zh: { name: "中文（简体）", tag: "zh-Hans", og: "zh_CN" },
  ja: { name: "日本語", tag: "ja", og: "ja_JP" },
  es: { name: "Español", tag: "es", og: "es_ES" },
  pt: { name: "Português", tag: "pt", og: "pt_PT" },
});
