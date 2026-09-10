#!/usr/bin/env node
/**
 * 이미지 생성 두 경로를 한 입구로 — GPT(ChatGPT 구독) / krea2(로컬 ComfyUI).
 *
 * 🔴 이 파일이 있는 이유는 «두 경로 다 산출물을 엉뚱한 데 떨구기» 때문이다.
 *    - GPT : 샌드박스가 지정 경로 복사를 막아 ~/.codex/generated_images/<세션>/ 에 남는다
 *    - krea2: 언제나 ComfyUI/output/ 에 쓴다
 *    매번 손으로 옮기다 잊으면 «생성은 됐는데 파일이 없다»가 된다.
 *
 * 쓰기
 *   node gen.mjs gpt   --prompt "..." --out a.png [--ref r.png ...] [--transparent]
 *   node gen.mjs krea2 --prompt "..." --out a.png [--ref r.png ...] [--size 1024x576] [--seed 1234]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const HOME = os.homedir();
const GPT_RUNNER = path.join(HOME, '.claude/skills/gpt-image/scripts/gpt_image.mjs');
const CODEX_OUT = path.join(HOME, '.codex/generated_images');
const COMFY = 'C:/ComfyUI_windows_portable/ComfyUI';
const KREA = 'C:/projects/comfy_test/scripts/krea2_edit.py';
const KREA_LORA = 'krea2_identity_edit_v1.safetensors';

const argv = process.argv.slice(2);
const route = argv.shift();
const opt = { ref: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--transparent') opt.transparent = true;
  else if (a === '--ref') opt.ref.push(argv[++i]);
  else if (a.startsWith('--')) opt[a.slice(2)] = argv[++i];
}
if (!route || !opt.prompt || !opt.out) {
  console.error('usage: gen.mjs <gpt|krea2> --prompt "..." --out out.png [--ref r.png] ...');
  process.exit(2);
}
fs.mkdirSync(path.dirname(path.resolve(opt.out)) || '.', { recursive: true });

/** 어떤 디렉터리 아래에서 가장 최근에 생긴 png. 생성 «전» 시각보다 새 것만 인정한다. */
const newestPng = (dir, since) => {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.png')) {
        const st = fs.statSync(p);
        if (st.mtimeMs > since) out.push({ p, t: st.mtimeMs });
      }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out.sort((a, b) => b.t - a.t)[0]?.p;
};

const started = Date.now() - 2000;

if (route === 'gpt') {
  // 🔴 --out 을 줘도 샌드박스가 복사를 막는다. 실패 메시지 안에 «실제 경로»가 들어 있고,
  //    없으면 ~/.codex/generated_images 에서 방금 생긴 png 를 집는다.
  const args = [GPT_RUNNER, 'generate', '--prompt', opt.prompt, '--out', path.basename(opt.out)];
  for (const r of opt.ref) args.push('--reference', path.resolve(r));
  if (opt.transparent) args.push('--background', 'transparent');
  let log = '';
  try {
    log = execFileSync('node', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 24 });
  } catch (e) {
    log = `${e.stdout || ''}${e.stderr || ''}`;
  }
  const hit = log.match(/([A-Za-z]:\\[^\r\n"]*?\.png)/g)?.filter((p) => p.includes('generated_images')).pop();
  const src = (hit && fs.existsSync(hit) && hit) || newestPng(CODEX_OUT, started);
  if (!src) {
    console.error(log.trim().split('\n').slice(-6).join('\n'));
    process.exit(1);
  }
  fs.copyFileSync(src, opt.out);
  console.log(opt.out);
} else if (route === 'krea2') {
  // 🔴 ComfyUI 가 떠 있어야 한다.
  try {
    execFileSync('curl', ['-s', '-m', '4', '-o', os.devNull, 'http://127.0.0.1:8188/system_stats']);
  } catch {
    console.error('ComfyUI 가 안 떠 있다. 먼저 띄울 것:\n'
      + '  powershell -c "Start-Process C:\\ComfyUI_windows_portable\\run_nvidia_gpu.bat -WindowStyle Minimized"\n'
      + '  (모델 로딩까지 30~90초. 127.0.0.1:8188 이 200 이면 준비 완료)');
    process.exit(1);
  }
  // 🔴 --prompt-file 은 «한 줄에 한 프롬프트»다. 여러 줄로 주면 문단마다 따로 생성된다.
  const one = opt.prompt.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).join(' ');
  const tmp = path.join(os.tmpdir(), `krea2-${Date.now()}.txt`);
  fs.writeFileSync(tmp, one + '\n', 'utf8');
  // 🔴 --ref 는 «필수»이고 파일은 ComfyUI/input 에 있어야 한다. 없으면 중립 한 장을 만들어 채운다.
  const refs = [];
  for (const r of (opt.ref.length ? opt.ref : ['__neutral__'])) {
    if (r === '__neutral__') {
      const n = path.join(COMFY, 'input', 'neutral.png');
      if (!fs.existsSync(n)) {
        execFileSync('python', ['-c',
          `from PIL import Image; Image.new('RGB',(512,512),(240,235,224)).save(r'${n}')`]);
      }
      refs.push('neutral.png');
    } else {
      const base = path.basename(r);
      fs.copyFileSync(path.resolve(r), path.join(COMFY, 'input', base));
      refs.push(base);
    }
  }
  const [w, h] = (opt.size || '1024x576').split('x');
  const a = [KREA, '--ref', ...refs, '--prompt-file', tmp,
    '--width', w, '--height', h, '--lora', KREA_LORA,
    '--seed', opt.seed || String((Math.random() * 1e6) | 0), '--prefix', 'gen'];
  try {
    execFileSync('python', a, { cwd: path.dirname(path.dirname(KREA)), stdio: 'inherit' });
  } catch { /* 아래에서 산출물로 판정한다 */ }
  const src = newestPng(path.join(COMFY, 'output'), started);
  if (!src) { console.error('krea2 산출물을 못 찾았다.'); process.exit(1); }
  fs.copyFileSync(src, opt.out);
  fs.unlinkSync(tmp);
  console.log(opt.out);
} else {
  console.error(`모르는 경로: ${route} (gpt | krea2)`);
  process.exit(2);
}
