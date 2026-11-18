import { siteConfig, localeMetadata } from "./site.config.js?v=20261118-languages";
import { selectLocale, youtubeId } from "./lib.js?v=20261118-browser-language";
import { connectDiscLyrics } from "./lyrics.js?v=20261118-lyrics";

const $ = selector => document.querySelector(selector);
const audio = $("#audio");
const discStage = $("#disc-stage");
const discButton = $("#disc-toggle");
const discError = $("#disc-error");
const languageMenu = $("#language-menu");
const languageTrigger = $("#language-trigger");
const cache = new Map();
let dictionary = {};
let languageRequest = 0;
let state = "ready";
const t = key => dictionary[key] || key;

function readSavedLanguage() {
  try { return localStorage.getItem("velvet-index-language") || ""; } catch { return ""; }
}

async function loadDictionary(language) {
  if (!cache.has(language)) {
    const response = await fetch(new URL(`./locales/${language}.json`, import.meta.url), { cache: "no-cache" });
    if (!response.ok) throw new Error(`Locale ${language}: ${response.status}`);
    cache.set(language, await response.json());
  }
  return cache.get(language);
}

function updatePlayerLabels() {
  const playing = !audio.paused && !audio.ended;
  discStage.dataset.state = state;
  discStage.classList.toggle("is-active", playing);
  discButton.setAttribute("aria-label", t(playing ? "disc.pause" : "disc.play"));
  discButton.setAttribute("aria-busy", String(state === "loading"));
  if (!discError.hidden) discError.textContent = t("disc.error");
}

async function setLanguage(language, persist = false) {
  if (!siteConfig.locales.includes(language)) return;
  const request = ++languageRequest;
  try {
    const nextDictionary = await loadDictionary(language);
    if (request !== languageRequest) return;
    dictionary = nextDictionary;
    const locale = localeMetadata[language];
    document.documentElement.lang = locale.tag;
    for (const [attribute, target] of [["data-i18n", null], ["data-i18n-alt", "alt"], ["data-i18n-aria", "aria-label"]]) {
      document.querySelectorAll(`[${attribute}]`).forEach(element => {
        const text = t(element.getAttribute(attribute));
        if (target) element.setAttribute(target, text); else element.textContent = text;
      });
    }
    document.title = t("meta.title");
    $("meta[name=description]").content = t("meta.description");
    $("meta[property='og:title']").content = t("meta.title");
    $("meta[property='og:description']").content = t("meta.description");
    $("meta[property='og:locale']").content = locale.og;
    document.querySelectorAll("[data-lang]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.lang === language)));
    $("#language-current").textContent = locale.name;
    $("#language-current").lang = locale.tag;
    $("#language-code").textContent = language.toUpperCase();
    languageTrigger.setAttribute("aria-label", `${t("nav.language")} · ${locale.name}`);
    updatePlayerLabels();
    if (persist) {
      try { localStorage.setItem("velvet-index-language", language); } catch { /* Language still works without storage. */ }
      const url = new URL(location.href);
      url.searchParams.set("lang", language);
      history.replaceState(null, "", url);
    }
    return true;
  } catch (error) {
    console.warn("Language could not be loaded.", error);
    return false;
  }
}

function setupLanguageMenu() {
  languageMenu.hidden = false;
  const options = [...languageMenu.querySelectorAll("[data-lang]")];
  options.forEach(button => button.addEventListener("click", async () => {
    if (await setLanguage(button.dataset.lang, true)) {
      languageMenu.open = false;
      languageTrigger.focus();
    }
  }));
  document.addEventListener("pointerdown", event => {
    if (!languageMenu.contains(event.target)) languageMenu.open = false;
  });
  languageMenu.addEventListener("focusout", event => {
    if (event.relatedTarget && !languageMenu.contains(event.relatedTarget)) languageMenu.open = false;
  });
  languageMenu.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      languageMenu.open = false;
      languageTrigger.focus();
      event.preventDefault();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      languageMenu.open = true;
      const index = options.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
        : index < 0 ? (event.key === "ArrowUp" ? options.length - 1 : 0)
        : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
      options[next].focus();
    }
  });
}

function showAudioError() {
  audio.pause();
  state = "paused";
  discError.hidden = false;
  updatePlayerLabels();
}

function setupPlayer() {
  audio.controls = false;
  discButton.hidden = false;
  const loadLyrics = connectDiscLyrics({
    video: audio,
    trackElement: $("#lyrics-track"),
    container: $("#disc-lyrics"),
    text: $("#disc-lyric-text"),
    accessibleText: $("#disc-lyric-accessible"),
  });
  const togglePlayback = async () => {
    discError.hidden = true;
    if (!audio.paused) { audio.pause(); return; }
    state = "loading";
    updatePlayerLabels();
    try {
      // Keep the media URL inactive until the first explicit play request.
      if (!audio.hasAttribute("src")) audio.src = audio.dataset.src;
      loadLyrics();
      await audio.play();
    } catch (error) { if (error.name !== "AbortError") showAudioError(); }
  };
  discButton.addEventListener("click", togglePlayback);
  audio.addEventListener("playing", () => { state = "playing"; updatePlayerLabels(); });
  audio.addEventListener("pause", () => { state = "paused"; updatePlayerLabels(); });
  audio.addEventListener("waiting", () => { state = audio.paused ? "paused" : "loading"; updatePlayerLabels(); });
  audio.addEventListener("seeking", () => { if (!audio.paused) { state = "loading"; updatePlayerLabels(); } });
  audio.addEventListener("seeked", () => { state = audio.paused ? "paused" : audio.readyState >= 3 ? "playing" : "loading"; updatePlayerLabels(); });
  audio.addEventListener("ended", () => { state = "ready"; updatePlayerLabels(); });
  audio.addEventListener("error", showAudioError);
}

function setupVideo() {
  const id = youtubeId(siteConfig.youtubeUrl);
  if (!id) {
    $("#video-pending").hidden = false;
    $("#video-available").hidden = true;
    return;
  }
  $("#video-pending").hidden = true;
  $("#video-available").hidden = false;
  $("#youtube-link").href = `https://www.youtube.com/watch?v=${id}`;
  $("#youtube-link").addEventListener("click", () => {
    audio.pause();
  });
}

const preferredLanguage = selectLocale({ search: location.search, saved: readSavedLanguage(), languages: navigator.languages, supported: siteConfig.locales, fallback: siteConfig.defaultLocale });
const ready = await setLanguage(preferredLanguage) || await setLanguage(siteConfig.defaultLocale);
if (ready) {
  setupLanguageMenu();
  setupPlayer();
  setupVideo();
}
