import { siteConfig } from "./site.config.js?v=20261117-disc";
import { selectLocale, youtubeId } from "./lib.js";

const $ = selector => document.querySelector(selector);
const audio = $("#audio");
const discStage = $("#disc-stage");
const discButton = $("#disc-toggle");
const discError = $("#disc-error");
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
    document.documentElement.lang = language;
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
    $("meta[property='og:locale']").content = language === "fr" ? "fr_FR" : "en_GB";
    document.querySelectorAll("[data-lang]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.lang === language)));
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

function showAudioError() {
  audio.pause();
  state = "paused";
  discError.hidden = false;
  updatePlayerLabels();
}

function setupPlayer() {
  audio.controls = false;
  discButton.hidden = false;
  const togglePlayback = async () => {
    discError.hidden = true;
    if (!audio.paused) { audio.pause(); return; }
    state = "loading";
    updatePlayerLabels();
    try {
      // Keep the media URL inactive until the first explicit play request.
      if (!audio.hasAttribute("src")) audio.src = audio.dataset.src;
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
  $(".language-switch").hidden = false;
  document.querySelectorAll("[data-lang]").forEach(button => button.addEventListener("click", () => setLanguage(button.dataset.lang, true)));
  setupPlayer();
  setupVideo();
}
