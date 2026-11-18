// Pure helpers shared by the page and its checks.
export function selectLocale({ search = "", saved = "", languages = [], supported = ["fr", "en"], fallback = "fr" } = {}) {
  const requested = new URLSearchParams(search).get("lang");
  return [requested, ...languages, saved, fallback]
    .filter(value => typeof value === "string")
    .map(value => value.toLowerCase().split("-")[0])
    .find(value => supported.includes(value)) || fallback;
}

export function formatTime(seconds) {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function youtubeId(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    let id;
    if (host === "youtu.be") id = url.pathname.slice(1);
    else if (["youtube.com", "www.youtube.com", "m.youtube.com", "www.youtube-nocookie.com"].includes(host)) {
      id = url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)\/?$/)?.[1];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
  } catch { return null; }
}
