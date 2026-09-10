// 레인 감독자 — 죽은 레인을 다시 세운다.
// 🔴 레인은 소켓이 한 번 끊기면(ECONNABORTED 실측 3회) 그냥 종료한다. 재시도를 넣었어도
//    프로세스가 통째로 사라지는 경우는 남으므로, 밖에서 지켜보는 눈이 하나 필요하다.
// 🔴 레인 인자는 **처음 것 그대로** 다시 준다 — 러너가 R2 를 보고 끝난 시리즈를 건너뛰므로 멱등이다.
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const DIR = path.join(ROOT, '.draw', 'lanes');   // 레인 로그 — .draw 와 함께 gitignore 된다
const LOOP = path.join(HERE, 'draw-changjak-loop.mjs');
fs.mkdirSync(DIR, { recursive: true });

// 🔴 레인끼리 시리즈가 겹치면 **같은 권을 같은 파일 경로에 둘이 그린다** — 실제로 한 번 냈다.
//    남은 권수가 많은 시리즈부터 전용 레인을 준다 — 한도가 끊기는 자리가
//    「24권을 25권으로」가 아니라 「통째로 빈 시리즈」가 되면 그게 제일 비싸다.
// 🔴 첫 인자 = 시리즈당 상한. 25 로 끕으면 전 시리즈가 반은 선다(1차 목표).
//    26~50 구간을 그릴 때는 50 으로 올린다 — 단, 그전에 앵커 조항이 권 번호 목록이라
//    26 이후가 밖에 있는 문제를 먼저 보아야 한다(docs/art-direction/_SCENE-FINDINGS.md).
const LANES = {
  L1: ['25', 'bami'],
  L2: ['25', 'kota'],
  L3: ['25', 'moya'],
  L4: ['25', 'nono'],
  L5: ['25', 'bung', 'mio', 'yuki'],
};

const running = () => {
  try {
    return execFileSync('powershell', ['-NoProfile', '-Command',
      "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'draw-loop' } | ForEach-Object { $_.CommandLine }"],
      { encoding: 'utf8', maxBuffer: 1 << 24 });
  } catch { return ''; }
};

const stamp = () => new Date().toTimeString().slice(0, 8);

// 🔴 한도가 차면 레인이 바로 죽고, 그대로 두면 60초마다 다시 세워 밤새 헛돌게 된다.
//    금방 죽은 레인은 기다리는 시간을 두 배씩 늘린다(최대 30분). 한도가 풀리면 저절로 다시 붙는다.
const QUICK_MS = 5 * 60 * 1000;
const MAX_WAIT = 30 * 60 * 1000;
const state = {};  // name -> { startedAt, wait, nextTry }

for (;;) {
  const ps = running();
  const now = Date.now();
  for (const [name, args] of Object.entries(LANES)) {
    const sig = args.join(' ');
    const st = (state[name] ??= { startedAt: 0, wait: 0, nextTry: 0 });
    if (ps.includes(sig)) { st.wait = 0; continue; }
    if (st.startedAt && now - st.startedAt < QUICK_MS) {
      st.wait = Math.min(st.wait ? st.wait * 2 : 2 * 60 * 1000, MAX_WAIT);
      st.nextTry = now + st.wait;
      console.log(`${stamp()} ${name} 세우자마자 죽었다 — ${Math.round(st.wait / 60000)}분 뒤에 다시 본다`);
      st.startedAt = 0;
      continue;
    }
    if (now < st.nextTry) continue;
    const log = `${DIR}/lane-${name}.log`;
    const fd = fs.openSync(log, 'a');
    const child = spawn('node', [LOOP, ...args], { cwd: ROOT, stdio: ['ignore', fd, fd], detached: true });
    child.unref();
    st.startedAt = now;
    console.log(`${stamp()} ${name} 없어서 다시 세웠다 — pid ${child.pid} · ${sig}`);
  }
  await new Promise((r) => setTimeout(r, 60000));
}
