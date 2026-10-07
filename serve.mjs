import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync, constants as zlibConstants } from 'node:zlib';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

// Text types worth compressing on the fly. Binary media (images, fonts, video) is
// already compressed — re-compressing wastes CPU and can grow the payload, so skip it.
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg']);

// Long-lived immutable caching for content-stable static media; short/revalidated for
// code and HTML so edits show up. (In production these media names would be content-
// hashed so 'immutable' is always safe; here their bytes are effectively versioned.)
const IMMUTABLE = new Set(['.woff2', '.woff', '.ttf', '.avif', '.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.mp4', '.webm']);

function cacheControl(ext) {
  if (ext === '.html') return 'no-cache';                               // always revalidate via ETag
  if (IMMUTABLE.has(ext)) return 'public, max-age=31536000, immutable'; // 1 year
  return 'no-cache';                                                    // css/js: revalidate via ETag so edits show up
}

function pickEncoding(accept = '') {
  if (/\bbr\b/.test(accept)) return 'br';
  if (/\bgzip\b/.test(accept)) return 'gzip';
  return null;
}

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) throw new Error('forbidden');

    const info = await stat(file);
    const ext = extname(file).toLowerCase();
    const etag = `"${info.size}-${Math.round(info.mtimeMs)}"`;

    const headers = {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': cacheControl(ext),
      'ETag': etag,
      'Vary': 'Accept-Encoding',
    };

    // Conditional request — let the browser reuse its cached copy.
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers);
      return res.end();
    }

    // Range requests (video/audio seeking) — respond 206 with the requested byte slice.
    // Only for uncompressed binary; text is served whole (and optionally compressed).
    if (!COMPRESSIBLE.has(ext)) {
      headers['Accept-Ranges'] = 'bytes';
      const range = req.headers.range;
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        let start = m && m[1] ? parseInt(m[1], 10) : 0;
        let end = m && m[2] ? parseInt(m[2], 10) : info.size - 1;
        if (Number.isNaN(start)) start = 0;
        if (Number.isNaN(end) || end >= info.size) end = info.size - 1;
        if (start > end) {
          res.writeHead(416, { ...headers, 'Content-Range': `bytes */${info.size}` });
          return res.end();
        }
        const chunk = (await readFile(file)).subarray(start, end + 1);
        headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
        headers['Content-Length'] = chunk.length;
        res.writeHead(206, headers);
        return res.end(chunk);
      }
    }

    let data = await readFile(file);

    const enc = COMPRESSIBLE.has(ext) ? pickEncoding(req.headers['accept-encoding']) : null;
    if (enc === 'br') {
      data = brotliCompressSync(data, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 6 } });
      headers['Content-Encoding'] = 'br';
    } else if (enc === 'gzip') {
      data = gzipSync(data, { level: 6 });
      headers['Content-Encoding'] = 'gzip';
    }

    headers['Content-Length'] = data.length;
    res.writeHead(200, headers);
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}).listen(PORT, () => console.log(`Serving ${ROOT} at http://localhost:${PORT}`));
