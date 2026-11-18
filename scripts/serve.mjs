// Small local preview server with byte ranges, so audio seeking matches hosting.
import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep, extname } from "node:path";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".vtt": "text/vtt; charset=utf-8" };

http.createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405); response.end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const path = resolve(root, `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`);
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) { response.writeHead(403); response.end(); return; }
    const info = await stat(path);
    if (!info.isFile()) { response.writeHead(404); response.end(); return; }
    let start = 0, end = info.size - 1;
    const range = request.headers.range;
    const headers = { "Content-Type": types[extname(path)] || "application/octet-stream", "Accept-Ranges": "bytes", "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff" };
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) { response.writeHead(416, {"Content-Range": `bytes */${info.size}`}); response.end(); return; }
      if (!match[1]) start = Math.max(0, info.size - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(Number(match[2]), end); }
      if (start > end || start >= info.size) { response.writeHead(416, {"Content-Range": `bytes */${info.size}`}); response.end(); return; }
      headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
    }
    headers["Content-Length"] = Math.max(0, end - start + 1);
    response.writeHead(range ? 206 : 200, headers);
    if (request.method === "HEAD" || !info.size) response.end();
    else {
      const stream = createReadStream(path, {start, end});
      stream.on("error", () => response.destroy());
      response.on("close", () => stream.destroy());
      stream.pipe(response);
    }
  } catch { response.writeHead(404); response.end("Not found"); }
}).listen(1984, "127.0.0.1", () => console.log("Local: http://127.0.0.1:1984/"));
