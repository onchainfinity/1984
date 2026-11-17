import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { selectLocale, youtubeId, formatTime } from "../dist/lib.js";
import { siteConfig } from "../dist/site.config.js";

const root = new URL("../dist/", import.meta.url);
const read = async file => readFile(new URL(file, root), "utf8");

test("Every visible/accessible translation and dynamic player state exists in both languages", async () => {
  const dictionaries = await Promise.all(siteConfig.locales.map(async locale => JSON.parse(await read(`locales/${locale}.json`))));
  assert.deepEqual(Object.keys(dictionaries[0]).sort(), Object.keys(dictionaries[1]).sort());
  const html = await read("index.html");
  const keys = [...html.matchAll(/data-i18n(?:-alt|-aria)?="([^"]+)"/g)].map(match => match[1]);
  keys.push("meta.title", "meta.description", "audio.play", "audio.pause", "audio.loading", "audio.ready", "audio.paused", "audio.playing", "audio.error", "video.title");
  for (const dictionary of dictionaries) for (const key of keys) assert.ok(dictionary[key]?.trim(), key);
});

test("Deep links override saved language; browser regions and unsupported languages fall back", () => {
  assert.equal(selectLocale({ search: "?lang=en", saved: "fr", languages: ["fr-CH"] }), "en");
  assert.equal(selectLocale({ search: "?lang=xx", saved: "fr", languages: ["en-GB"] }), "fr");
  assert.equal(selectLocale({ languages: ["de-CH", "en-US"] }), "en");
  assert.equal(selectLocale({ languages: ["ja"] }), "fr");
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
