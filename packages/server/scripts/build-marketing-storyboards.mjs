// 동화책 릴스 스토리보드(경량 템플릿) 빌더.
// 소스: packages/server/scripts/_data/marketing/storyboards/<storybookId>.json
//   { storybookId, title, hook, totalSec, scenes:[{ label, sec, narration, screen, subtitle, imagePrompt }] }
// 출력: packages/client/public/marketing-storyboards/<storybookId>.html  +  index.json (전체 id 배열)
// ReelsPanel 📋 스토리보드 탭이 iframe 으로 로드. 전 언어 공용(한국어 기준).
// 실행: node packages/server/scripts/build-marketing-storyboards.mjs [--ids a,b | --all]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dir, '_data', 'marketing', 'storyboards');
const OUT = path.join(__dir, '..', '..', 'client', 'public', 'marketing-storyboards');

function parseArgs(argv) {
  const a = { ids: null, all: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--all') a.all = true;
    else if (argv[i] === '--ids') a.ids = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (!a.all && !a.ids) a.all = true; // 기본 전체
  return a;
}

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function sceneHtml(sc, i) {
  return `
    <section class="scene">
      <div class="scene-head">
        <span class="num">#${i + 1}</span>
        <span class="label">${esc(sc.label || '')}</span>
        <span class="sec">${esc(sc.sec || '')}s</span>
      </div>
      <div class="scene-body">
        <div class="frame"><div class="frame-inner">${esc(sc.label || '')}</div></div>
        <div class="fields">
          <div class="field"><b>🎙️ 나레이션</b><p>${esc(sc.narration || '')}</p></div>
          <div class="field"><b>🎬 화면 연출</b><p>${esc(sc.screen || '')}</p></div>
          ${sc.subtitle ? `<div class="field"><b>💬 자막</b><p class="sub">${esc(sc.subtitle)}</p></div>` : ''}
          ${sc.imagePrompt ? `<div class="field prompt"><b>🖼️ 이미지/영상 프롬프트 (EN)</b><p><code>${esc(sc.imagePrompt)}</code></p></div>` : ''}
        </div>
      </div>
    </section>`;
}

function render(sb) {
  const scenes = (sb.scenes || []).map(sceneHtml).join('');
  return `<!doctype html>
<html lang="ko"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(sb.title)} — 릴스 스토리보드</title>
<style>
  :root{ --coral:#FF6B5E; --peach:#FFE8D6; --ink:#2B2B2B; --mut:#7A7A7A; --line:#EDE6DD; --bg:#FFF9F3; }
  *{box-sizing:border-box} body{margin:0;font-family:'Pretendard',system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.55}
  .wrap{max-width:860px;margin:0 auto;padding:28px 20px 60px}
  header.top{border-bottom:3px solid var(--coral);padding-bottom:14px;margin-bottom:8px}
  .kicker{font-size:12px;font-weight:800;letter-spacing:.08em;color:var(--coral);text-transform:uppercase}
  h1{font-size:26px;margin:6px 0 4px;font-weight:800}
  .meta{font-size:13px;color:var(--mut)}
  .hook{background:var(--peach);border-radius:14px;padding:14px 16px;margin:16px 0 22px;font-size:15px;font-weight:600}
  .scene{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 16px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
  .scene-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
  .num{background:var(--coral);color:#fff;font-weight:800;font-size:13px;border-radius:999px;padding:2px 10px}
  .label{font-weight:800;font-size:15px}
  .sec{margin-left:auto;font-size:12px;color:var(--mut);background:#F4EEE6;border-radius:999px;padding:2px 9px}
  .scene-body{display:flex;gap:14px}
  .frame{flex:0 0 90px}
  .frame-inner{aspect-ratio:9/16;border-radius:10px;background:linear-gradient(160deg,#FFD9CC,#FFB3A3);display:flex;align-items:center;justify-content:center;text-align:center;font-size:11px;font-weight:700;color:#8A3B2E;padding:6px}
  .fields{flex:1;min-width:0}
  .field{margin-bottom:8px}
  .field b{display:block;font-size:11px;color:var(--mut);margin-bottom:2px}
  .field p{margin:0;font-size:14px}
  .field .sub{font-weight:700}
  .prompt code{display:block;background:#2B2B2B;color:#E8F0E0;font-size:12px;border-radius:8px;padding:8px 10px;white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,Menlo,monospace}
  footer.bot{margin-top:20px;text-align:center;font-size:12px;color:var(--mut)}
</style></head>
<body><div class="wrap">
  <header class="top">
    <div class="kicker">릴스 스토리보드 · 9:16 · 약 ${esc(sb.totalSec || '')}초</div>
    <h1>${esc(sb.title)}</h1>
    <div class="meta">탱고북 동화 · 전 언어 공용(한국어 기준) · 나레이션=성우 책읽기체 / 영상=효과음만</div>
  </header>
  ${sb.hook ? `<div class="hook">🪝 ${esc(sb.hook)}</div>` : ''}
  ${scenes}
  <footer class="bot">탱고북 · tangobook.co.kr · 7일 무료체험</footer>
</div></body></html>`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter((f) => f.endsWith('.json')) : [];
  const chosen = args.all ? files : args.ids.map((id) => `${id}.json`);

  let n = 0;
  for (const f of chosen) {
    const p = path.join(SRC, f);
    if (!fs.existsSync(p)) { console.warn(`스킵(없음): ${f}`); continue; }
    const sb = JSON.parse(fs.readFileSync(p, 'utf8'));
    fs.writeFileSync(path.join(OUT, `${sb.storybookId}.html`), render(sb));
    n++;
  }

  // manifest = OUT 에 실제 존재하는 모든 html id
  const ids = fs.readdirSync(OUT).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''));
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(ids));
  console.log(`스토리보드 ${n}개 생성. manifest 총 ${ids.length}개.`);
}

main();
