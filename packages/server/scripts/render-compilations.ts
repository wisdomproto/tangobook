// 이미 렌더된 롱폼들을 이어붙여 6~12분 "연속듣기" 컴필레이션을 만든다.
//
// 🔴 재렌더링하지 않는다. 기존 롱폼 mp4 가 전부 동일 파라미터
// (h264/1920x1080/30fps/yuvj420p + aac/48k/stereo)로 렌더돼 있어 **무손실 스트림 복사**로 붙는다
// (3편 9.5분 concat 0.87초 · 재인코딩 0 · 화질손실 0 · 전체 디코드 무결성 검증 통과).
//
// 배경: 벤치마크 실측(2026-07-24) 결과 잘 되는 채널은 6~20분인데 우리는 3~4분이었다.
// 원인은 낭독속도(우리가 오히려 제일 빠름)도 빈 구간(커버 97%)도 아닌 **대본 분량**이라,
// 대본을 다시 쓰지 않고 길이대를 맞추는 가장 싼 수단이 묶음이다.
//
// 실행:
//   pnpm --filter @tangobook/server exec tsx scripts/render-compilations.ts --category=life        # dry-run
//   pnpm --filter @tangobook/server exec tsx scripts/render-compilations.ts --category=life --apply
//   옵션: --style=animation --lang=ko --min=360 --max=720 --max-parts=6 --limit=1 --keep
import 'dotenv/config';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';
import { uploadBufferToR2 } from '../src/providers/r2.provider.js';
import {
  LIFE_TRACKS,
  groupByTrack,
  unassignedParts,
  buildTrackCompilationMeta,
  type CompilationPart,
} from '../src/services/reel/compilation.js';

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(`--${f}`);
const val = (f: string, d = '') => {
  const hit = argv.find((a) => a.startsWith(`--${f}=`));
  return hit ? hit.slice(f.length + 3) : d;
};

const APPLY = has('apply');
const CATEGORY = val('category', 'life');
const STYLE = val('style', '');
const LANG = val('lang', 'ko');
const MIN = Number(val('min', '360'));
const MAX = Number(val('max', '720'));
const MAX_PARTS = Number(val('max-parts', '6'));
const LIMIT = Number(val('limit', '0')) || Infinity;
const KEEP = has('keep');

const SERIES_LABEL: Record<string, string> = {
  life: '호리네 생활동화',
  nature: '자연관찰 동화',
  classic: '세계명작 동화',
};

// 카테고리 → 트랙 정의. 자연·명작은 아직 주제 분류가 없어 미지원(추가 시 여기에 등록).
const TRACKS: Record<string, typeof LIFE_TRACKS | undefined> = {
  life: LIFE_TRACKS,
};

async function ffmpegPath(): Promise<string> {
  // ffmpeg-static 우선(ESM 이라 동적 import), 없으면 시스템 ffmpeg.
  try {
    const mod: any = await import('ffmpeg-static');
    const p = typeof mod === 'string' ? mod : (mod?.default ?? mod?.path);
    if (p && fs.existsSync(p)) return p;
  } catch {
    /* fallthrough */
  }
  return 'ffmpeg';
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}: ${err.slice(-500)}`))
    );
  });
}

async function download(url: string, dest: string) {
  const res = await fetch(encodeURI(url));
  if (!res.ok) throw new Error(`다운로드 실패 ${res.status}: ${url}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정');

  // 대상 롱폼 = 해당 카테고리 · 언어(· 그림체) 렌더 완료분
  const { data: rows, error } = await sb
    .from('mkt_youtube_contents')
    .select(
      'content_id, video_url, video_settings, mkt_contents!inner(title, category, project_id)'
    )
    .not('video_url', 'is', null);
  if (error) throw new Error(`조회 실패: ${error.message}`);

  const candidates = (rows ?? [])
    .filter((r: any) => {
      const c = r.mkt_contents;
      if (!c || c.category !== CATEGORY) return false;
      const vs = r.video_settings ?? {};
      if (vs.language !== LANG) return false;
      if (STYLE && vs.artStyle !== STYLE) return false;
      return true;
    })
    .map((r: any) => ({
      bookId: r.video_settings?.bookId ?? '',
      title: r.mkt_contents.title as string,
      videoUrl: r.video_url as string,
      durationSec: 0, // 아래에서 실측
      projectId: r.mkt_contents.project_id as string,
    }))
    .sort((a: any, b: any) => a.title.localeCompare(b.title, 'ko', { numeric: true }));

  if (!candidates.length) {
    console.log(`대상 없음 (category=${CATEGORY} lang=${LANG}${STYLE ? ` style=${STYLE}` : ''})`);
    return;
  }
  console.log(`후보 롱폼 ${candidates.length}편 (category=${CATEGORY} lang=${LANG})`);

  // 길이 실측 (ffprobe 대신 HTTP 로 받지 않고 ffmpeg 로 원격 probe — 느리면 순차)
  const ff = await ffmpegPath();
  const probe = ff.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
  const useProbe = probe !== ff && fs.existsSync(probe) ? probe : 'ffprobe';
  for (const c of candidates as any[]) {
    c.durationSec = await new Promise<number>((resolve) => {
      const p = spawn(useProbe, [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'csv=p=0',
        encodeURI(c.videoUrl),
      ]);
      let out = '';
      p.stdout.on('data', (d) => (out += d.toString()));
      p.on('close', () => resolve(Math.round(Number(out.trim()) || 0)));
    });
  }
  const usable = (candidates as any[]).filter((c) => c.durationSec > 0);
  console.log(
    `길이 확인됨 ${usable.length}편 · 총 ${Math.round(usable.reduce((s, c) => s + c.durationSec, 0) / 60)}분`
  );

  // 🔴 묶는 기준 = 커리큘럼 트랙(주제). 순번 3편씩이 아니다 —
  // 벤치마크에서 "Ep.N + 개별 작품 나열"이 최하위(1,665~1,855), 테마 라벨이 최상위였다.
  const tracks = TRACKS[CATEGORY];
  if (!tracks) {
    console.log(`카테고리 '${CATEGORY}' 의 트랙 정의가 없습니다(현재 life 만 지원).`);
    return;
  }
  const orphans = unassignedParts(usable as CompilationPart[], tracks);
  if (orphans.length) {
    console.log(`⚠️ 트랙 미배정 ${orphans.length}편(회차 번호 없음/범위 밖) — 묶음에서 제외:`);
    orphans.slice(0, 5).forEach((o) => console.log(`   - ${o.title}`));
  }
  const groups = groupByTrack(usable as CompilationPart[], tracks);
  const targets = groups.slice(0, LIMIT === Infinity ? groups.length : LIMIT);

  console.log(`\n=== 컴필레이션 ${groups.length}편 계획 (처리 ${targets.length}편) ===`);
  targets.forEach((g, i) => {
    const meta = buildTrackCompilationMeta({
      seriesLabel: SERIES_LABEL[CATEGORY] ?? CATEGORY,
      track: g.track,
      parts: g.parts,
      totalSec: g.totalSec,
    });
    console.log(`\n[${i + 1}] ${Math.round(g.totalSec / 60)}분 · ${g.parts.length}편`);
    console.log(`    제목: ${meta.title}`);
    g.parts.forEach((p) => console.log(`      - ${p.title} (${p.durationSec}s)`));
  });

  if (!APPLY) {
    console.log('\n(dry-run) --apply 로 실제 생성·업로드');
    return;
  }

  const projectId = (usable[0] as any).projectId;
  for (let i = 0; i < targets.length; i++) {
    const b = targets[i];
    const meta = buildTrackCompilationMeta({
      seriesLabel: SERIES_LABEL[CATEGORY] ?? CATEGORY,
      track: b.track,
      parts: b.parts,
      totalSec: b.totalSec,
    });
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'comp-'));
    try {
      console.log(`\n[${i + 1}/${targets.length}] 조각 ${b.parts.length}개 다운로드…`);
      const files: string[] = [];
      for (let k = 0; k < b.parts.length; k++) {
        const f = path.join(tmp, `p${k}.mp4`);
        await download(b.parts[k].videoUrl, f);
        files.push(f);
      }
      const list = path.join(tmp, 'list.txt');
      fs.writeFileSync(list, files.map((f) => `file '${f.replace(/\\/g, '/')}'`).join('\n'));
      const out = path.join(tmp, 'out.mp4');
      console.log('  이어붙이는 중(무손실 스트림 복사)…');
      await run(ff, [
        '-y',
        '-v',
        'error',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        list,
        '-c',
        'copy',
        out,
      ]);

      const buf = fs.readFileSync(out);
      const key = `mkt/${projectId}/compilations/${CATEGORY}-${LANG}-${i + 1}-${Date.now()}.mp4`;
      console.log(`  업로드 ${(buf.length / 1e6).toFixed(0)}MB → ${key}`);
      const videoUrl = await uploadBufferToR2(buf, key, 'video/mp4');

      console.log(`  ✅ ${meta.title}`);
      console.log(`     ${videoUrl}`);
      console.log(`     🔴 유튜브 발행은 아직 자동 연결 안 됨 — 아래 "남은 배선" 참조`);
    } finally {
      if (!KEEP) fs.rmSync(tmp, { recursive: true, force: true });
      else console.log(`  (작업 폴더 유지: ${tmp})`);
    }
  }
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e);
  process.exit(1);
});
