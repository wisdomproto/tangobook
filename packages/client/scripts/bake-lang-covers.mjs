// Bake vi/th/zh title overlays (glass Jua pill) onto clean covers for every manifest entry (one browser).
// Step 3 of the multilingual-cover pipeline — see packages/server/scripts/register-lang-covers.ts header.
//   node scripts/bake-lang-covers.mjs [--force]
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const MANIFEST = path.resolve(process.cwd(), '../server/out/bake-manifest.json');
const OUT_DIR = path.resolve(process.cwd(), '../server/out/lang-covers');
const LANGS = ['vi', 'th', 'zh'];
const FONT = { ko: "'Jua'", zh: "'ZCOOL KuaiLe'", vi: "'Baloo 2'", th: "'Noto Sans Thai'" };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function html(cleanSrc, lang, title) {
  const fam = `${FONT[lang] ?? "'Baloo 2'"}, 'Baloo 2', sans-serif`;
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Jua&family=Baloo+2:wght@700;800&family=ZCOOL+KuaiLe&family=Noto+Sans+Thai:wght@700;900&display=swap');
html,body{margin:0;padding:0}
#cover{position:relative;width:1280px;height:720px;overflow:hidden;background:#241a14;container-type:inline-size}
#cover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pill{position:absolute;top:6%;left:50%;transform:translateX(-50%);width:max-content;max-width:88%;
  border-radius:22px;padding:14px 44px;border:1px solid rgba(255,255,255,.30);
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);background:rgba(22,16,11,0.46);
  box-shadow:0 6px 18px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.28)}
.ttl{display:block;text-align:center;color:#fff;line-height:1.12;word-break:keep-all;
  text-shadow:0 2px 6px rgba(0,0,0,.35);font-size:clamp(28px,6.2cqw,64px);font-family:${fam}}
</style></head>
<body><div id="cover"><img id="bg" src="${cleanSrc}"><div class="pill"><span class="ttl">${esc(title)}</span></div></div></body></html>`;
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  let ok = 0,
    skip = 0;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    const FORCE = process.argv.includes('--force');
    for (const m of manifest) {
      for (const lang of LANGS) {
        const title = m[lang];
        if (!title) {
          skip++;
          continue;
        }
        const out = path.join(OUT_DIR, `${m.id}-${m.style}-${lang}.webp`);
        if (!FORCE && fs.existsSync(out)) {
          skip++;
          continue;
        }
        try {
          const src = m.cleanUrl ?? (m.cleanLocal ? `data:image/webp;base64,${fs.readFileSync(m.cleanLocal).toString('base64')}` : '');
          await page.setContent(html(src, lang, title), { waitUntil: 'load', timeout: 60000 });
          // ensure the (remote) clean image actually decoded before screenshot
          await page.evaluate(async () => {
            const img = document.getElementById('bg');
            if (img && !img.complete) await new Promise((r) => { img.onload = img.onerror = r; });
            if (img && img.decode) await img.decode().catch(() => {});
            await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 8000))]);
          });
          const el = await page.$('#cover');
          const buf = await el.screenshot({ type: 'webp', quality: 92 });
          fs.writeFileSync(out, buf);
          ok++;
          console.log(`  ✓ ${m.id}/${m.style}/${lang} (${title})`);
        } catch (e) {
          console.error(`  ! ${m.id}/${m.style}/${lang}: ${e.message}`);
        }
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`\n[bake] ${ok} baked, ${skip} skipped → ${OUT_DIR}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
