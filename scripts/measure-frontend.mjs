import {gzipSync} from 'node:zlib';
import {writeFile, mkdir} from 'node:fs/promises';
const base = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';
const pages = ['/', '/dang-ky-thong-tin', '/dang-ky-thong-tin/chung-thieu-nhi', '/quan-tri'];
const results = [];
for (const path of pages) {
  await fetch(base + path);
  const timings = [];
  let html = '';
  for (let i = 0; i < 7; i++) {
    const start = performance.now();
    const r = await fetch(base + path);
    const headers = performance.now();
    if (!r.ok) throw Error(`${path}: ${r.status}`);
    html = await r.text();
    timings.push(headers - start);
  }
  const js = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const fonts = [...html.matchAll(/<link(?=[^>]*as="font")[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const css = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^"<>]*)"/g)].map((m) => m[1]);
  const bytes = async (paths) => {
    let raw = 0,
      gzip = 0;
    for (const path of new Set(paths)) {
      const r = await fetch(new URL(path.replaceAll('&amp;', '&'), base));
      const b = Buffer.from(await r.arrayBuffer());
      raw += b.length;
      gzip += gzipSync(b).length;
    }
    return {files: new Set(paths).size, raw, gzip};
  };
  results.push({
    path,
    ttfbMedianMs: Number(timings.sort((a, b) => a - b)[3].toFixed(2)),
    htmlGzip: gzipSync(html).length,
    js: await bytes(js),
    css: await bytes(css),
    fonts: await bytes(fonts),
  });
}
const report = {
  measuredAt: new Date().toISOString(),
  method:
    'Local production HTTP, warm requests, 7 samples per route; gzip calculated at default level. Initial HTML script/link resources only. Does not measure browser execution, dynamic chunks, Lighthouse or Core Web Vitals.',
  results,
};
await mkdir('.local/audits', {recursive: true});
await writeFile(process.argv[2] || '.local/audits/frontend.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
