import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { selectLocale, youtubeId, formatTime } from "../dist/lib.js";
import { siteConfig, localeMetadata } from "../dist/site.config.js";
import { connectDiscLyrics } from "../dist/lyrics.js";

const root = new URL("../dist/", import.meta.url);
const read = async file => readFile(new URL(file, root), "utf8");

test("Every visible/accessible translation and player state exists in all seven languages", async () => {
  const dictionaries = await Promise.all(siteConfig.locales.map(async locale => JSON.parse(await read(`locales/${locale}.json`))));
  assert.equal(dictionaries.length, 7);
  for (const dictionary of dictionaries) assert.deepEqual(Object.keys(dictionary).sort(), Object.keys(dictionaries[0]).sort());
  const html = await read("index.html");
  const keys = [...html.matchAll(/data-i18n(?:-alt|-aria)?="([^"]+)"/g)].map(match => match[1]);
  keys.push("meta.title", "meta.description", "disc.play", "disc.pause", "disc.error");
  for (const dictionary of dictionaries) for (const key of keys) assert.ok(dictionary[key]?.trim(), key);
});

test("Language dropdown, dictionaries and alternate links cover the same locales", async () => {
  const html = await read("index.html");
  assert.deepEqual([...html.matchAll(/data-lang="([^"]+)"/g)].map(match => match[1]), siteConfig.locales);
  assert.deepEqual(Object.keys(localeMetadata), siteConfig.locales);
  for (const locale of siteConfig.locales) {
    const meta = localeMetadata[locale];
    assert.ok(meta.name && meta.og);
    assert.ok(html.includes(`hreflang="${meta.tag}" href="${siteConfig.canonicalUrl}?lang=${locale}"`));
  }
  assert.equal(localeMetadata.zh.tag, "zh-Hans");
});

test("Explicit links override browser languages, which take priority over a saved choice", () => {
  assert.equal(selectLocale({ search: "?lang=en", saved: "fr", languages: ["fr-CH"] }), "en");
  assert.equal(selectLocale({ search: "?lang=xx", saved: "fr", languages: ["en-GB"] }), "en");
  assert.equal(selectLocale({ saved: "en", languages: ["fr-CH"] }), "fr");
  assert.equal(selectLocale({ languages: ["de-CH", "en-US"] }), "en");
  assert.equal(selectLocale({ languages: ["ja"] }), "fr");
  for (const [requested, expected] of [["ko-KR", "ko"], ["zh-Hans", "zh"], ["ja-JP", "ja"], ["es-MX", "es"], ["pt-BR", "pt"]]) {
    assert.equal(selectLocale({ languages: [requested], supported: siteConfig.locales }), expected);
    assert.equal(selectLocale({ search: `?lang=${requested}`, saved: "fr", supported: siteConfig.locales }), expected);
  }
  assert.equal(selectLocale({ saved: "pt", languages: ["ja-JP"], supported: siteConfig.locales }), "ja");
  assert.equal(selectLocale({ saved: "fr", languages: ["de-CH", "es-MX", "en-US"], supported: siteConfig.locales }), "es");
  assert.equal(selectLocale({ saved: "pt", languages: ["de-CH"], supported: siteConfig.locales }), "pt");
  assert.equal(selectLocale({ languages: ["de-CH"], supported: siteConfig.locales }), "fr");
});

test("YouTube only accepts valid IDs from supported HTTPS hosts", () => {
  for (const url of ["https://www.youtube.com/watch?v=abcdefghijk&t=10", "https://youtu.be/abcdefghijk", "https://youtube.com/shorts/abcdefghijk", "https://www.youtube-nocookie.com/embed/abcdefghijk"]) assert.equal(youtubeId(url), "abcdefghijk");
  for (const url of ["", "javascript:alert(1)", "https://evil.test/watch?v=abcdefghijk", "https://youtube.com.evil.test/watch?v=abcdefghijk", "https://youtube.com/watch?v=bad", "http://youtu.be/abcdefghijk"]) assert.equal(youtubeId(url), null);
  if (siteConfig.youtubeUrl) assert.ok(youtubeId(siteConfig.youtubeUrl), "A published clip needs a valid YouTube URL");
});

test("Static assets resolve under a project subpath, with no root-relative dependencies", async () => {
  const html = await read("index.html");
  const paths = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map(match => match[1]);
  for (const path of paths) await access(new URL(path, root));
  assert.ok(!/(?:src|href)="\/(?!\/)/.test(html));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]));
});

test("Audio time formats include complete 5:33 single and finite fallbacks", () => {
  assert.equal(formatTime(siteConfig.audioDuration), "5:33");
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(NaN), "0:00");
});

test("English lyrics have 28 ordered, nonoverlapping phrases within the final video", async () => {
  const vtt = await read("assets/golden-country-en.vtt");
  assert.ok(vtt.startsWith("WEBVTT\n"));
  const blocks = vtt.trim().split(/\n\n+/).slice(1);
  assert.equal(blocks.length, 28);
  const seconds = value => value.split(":").reduce((total, part) => total * 60 + Number(part), 0);
  let previousEnd = 0;
  for (const block of blocks) {
    const [id, timing, ...lines] = block.split("\n");
    const [start, end] = timing.split(" --> ").map(seconds);
    assert.ok(Number.isFinite(start) && start >= previousEnd && end > start, `Cue ${id}`);
    assert.ok(end < siteConfig.videoDuration, `Cue ${id} exceeds video duration`);
    assert.ok(lines.join(" ").trim());
    previousEnd = end;
  }
  assert.ok(blocks[0].includes("00:00:39.928"));
  assert.ok(blocks[27].includes("00:04:51.779"));
});

test("CD lyrics load only on request and follow native cue, gap, seek, end and error events", () => {
  const video = Object.assign(new EventTarget(), { ended: false, error: null, currentTime: 40 });
  const track = Object.assign(new EventTarget(), { mode: "disabled", activeCues: [] });
  const trackElement = Object.assign(new EventTarget(), {
    track, dataset: { src: "./assets/golden-country-en.vtt" },
    hasAttribute(name) { return Object.hasOwn(this, name); },
  });
  const container = { hidden: true }, text = { textContent: "" }, accessibleText = { textContent: "" };
  const load = connectDiscLyrics({ video, trackElement, container, text, accessibleText });
  assert.equal(trackElement.src, undefined);
  assert.equal(track.mode, "disabled");
  load();
  assert.equal(trackElement.src, "./assets/golden-country-en.vtt");
  assert.equal(track.mode, "hidden");
  track.activeCues = [{ startTime: 39.928, endTime: 43.356, text: "I bring blue flowers through the shade." }];
  track.dispatchEvent(new Event("cuechange"));
  assert.equal(container.hidden, false);
  assert.equal(text.textContent, track.activeCues[0].text);
  assert.equal(accessibleText.textContent, text.textContent);
  video.dispatchEvent(new Event("pause"));
  assert.equal(container.hidden, false);
  video.currentTime = 43.356;
  video.dispatchEvent(new Event("timeupdate"));
  assert.equal(container.hidden, true, "The exact end is excluded even if native activeCues still includes it");
  track.activeCues = [];
  video.dispatchEvent(new Event("seeked"));
  assert.equal(container.hidden, true);
  assert.equal(text.textContent, "");
  video.currentTime = 274.5;
  track.activeCues = [{ startTime: 274.081, endTime: 277.580, text: "The shade returns. Your breathing slows." }];
  video.dispatchEvent(new Event("seeked"));
  assert.equal(text.textContent, track.activeCues[0].text);
  video.ended = true;
  video.dispatchEvent(new Event("ended"));
  assert.equal(container.hidden, true);
  video.ended = false;
  video.dispatchEvent(new Event("timeupdate"));
  assert.equal(container.hidden, false);
  video.error = { code: 3 };
  video.dispatchEvent(new Event("error"));
  assert.equal(container.hidden, true);
});

test("Adjacent native cues never combine two lyric lines at the shared boundary", () => {
  const video = Object.assign(new EventTarget(), { currentTime: 119.24 });
  const track = Object.assign(new EventTarget(), { activeCues: [
    { startTime: 115.34, endTime: 119.24, text: "For once the world is here with me." },
    { startTime: 119.24, endTime: 124.48, text: "For once I feel where I can be." },
  ] });
  const trackElement = Object.assign(new EventTarget(), { track });
  const container = { hidden: true }, text = {}, accessibleText = {};
  connectDiscLyrics({ video, trackElement, container, text, accessibleText });
  track.dispatchEvent(new Event("cuechange"));
  assert.equal(text.textContent, "For once I feel where I can be.");
});
