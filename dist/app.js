import { siteConfig } from "./site.config.js?v=20261117-video";
import { selectLocale, formatTime, youtubeId } from "./lib.js";

const $ = selector => document.querySelector(selector);
const audio = $("#audio");
const player = $(".player");
const playButton = $("#play-button");
const seek = $("#seek");
const playerState = $("#player-state");
const playerError = $("#player-error");
const cache = new Map();
let dictionary = {};
let locale = siteConfig.defaultLocale;
let languageRequest = 0;
let state = "ready";
const t = key => dictionary[key] || key;

function readSavedLanguage() {
  try { return localStorage.getItem("velvet-index-language") || ""; } catch { return ""; }
}

async function loadDictionary(language) {
  if (!cache.has(language)) {
    const response = await fetch(new URL(`./locales/${language}.json`, import.meta.url));
    if (!response.ok) throw new Error(`Locale ${language}: ${response.status}`);
    cache.set(language, await response.json());
  }
  return cache.get(language);
}

function updatePlayerLabels() {
  const playing = !audio.paused && !audio.ended;
  player.classList.toggle("is-playing", playing);
  playButton.setAttribute("aria-label", t(playing ? "audio.pause" : "audio.play"));
  playerState.textContent = t(`audio.${state}`);
  if (!playerError.hidden) playerError.textContent = t("audio.error");
}

async function setLanguage(language, persist = false) {
  if (!siteConfig.locales.includes(language)) return;
  const request = ++languageRequest;
  try {
    const nextDictionary = await loadDictionary(language);
    if (request !== languageRequest) return;
    dictionary = nextDictionary;
    locale = language;
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
    const iframe = $("#video-player iframe");
    if (iframe) iframe.title = t("video.title");
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

function updateTime() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : siteConfig.audioDuration;
  const current = Math.min(audio.currentTime || 0, duration);
  seek.max = duration;
  seek.value = current;
  seek.style.setProperty("--progress", `${duration ? (current / duration) * 100 : 0}%`);
  seek.setAttribute("aria-valuetext", `${formatTime(current)} / ${formatTime(duration)}`);
  $("#current-time").textContent = formatTime(current);
  $("#duration").textContent = formatTime(duration);
}

function showAudioError() {
  state = "paused";
  playerError.hidden = false;
  updatePlayerLabels();
}

function closeVideoPlayer() {
  const video = $("#video-player");
  if (!video.firstChild) return;
  video.replaceChildren();
  video.hidden = true;
  $(".video-launch").hidden = false;
}

function setupPlayer() {
  audio.controls = false;
  $("#custom-player").hidden = false;
  playButton.addEventListener("click", async () => {
    playerError.hidden = true;
    if (!audio.paused) { audio.pause(); return; }
    // Unloading the iframe also stops a video that may already be playing.
    closeVideoPlayer();
    state = "loading";
    updatePlayerLabels();
    try { await audio.play(); } catch (error) { if (error.name !== "AbortError") showAudioError(); }
  });
  audio.addEventListener("playing", () => { state = "playing"; updatePlayerLabels(); });
  audio.addEventListener("pause", () => { state = "paused"; updatePlayerLabels(); });
  audio.addEventListener("waiting", () => { state = "loading"; updatePlayerLabels(); });
  audio.addEventListener("ended", () => { state = "ready"; updatePlayerLabels(); updateTime(); });
  audio.addEventListener("error", showAudioError);
  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("loadedmetadata", () => { seek.disabled = false; updateTime(); });
  seek.addEventListener("input", () => {
    audio.currentTime = Number(seek.value);
    updateTime();
  });
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
  $(".video-launch").hidden = false;
  $("#youtube-link").href = `https://www.youtube.com/watch?v=${id}`;
  $("#youtube-link").addEventListener("click", () => {
    audio.pause();
    closeVideoPlayer();
  });
  $(".video-launch").addEventListener("click", () => {
    audio.pause();
    const container = $("#video-player");
    if (!container.firstChild) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&hl=${locale}`;
      iframe.title = t("video.title");
      iframe.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      container.append(iframe);
    }
    container.hidden = false;
    $(".video-launch").hidden = true;
    container.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" });
    container.querySelector("iframe").focus({ preventScroll: true });
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
