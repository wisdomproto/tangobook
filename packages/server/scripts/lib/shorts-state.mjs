// scripts/lib/shorts-state.mjs — Shorts 업로드 상태 SSOT = R2. 로컬 파일은 최초 마이그레이션 소스 겸 백업.
import 'dotenv/config';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { uploadJsonToR2 } from '../../src/providers/r2.provider.js';

const R2_KEY = '_index/shorts-upload-state.json';
const LOCAL = fileURLToPath(new URL('../../../../docs/marketing/drafts/shorts-upload-state.json', import.meta.url));

export async function loadState() {
  // 🔴 404(최초 미존재)만 로컬 마이그레이션 폴백. transient 실패(레이트리밋 등)는 throw —
  //    stale 로컬로 R2 SSOT 를 덮어쓰면 멱등성 깨져 중복 업로드(쿼터 1,600/건)로 직결.
  const res = await fetch(`${process.env.R2_PUBLIC_URL}/${R2_KEY}?t=${Date.now()}`);
  if (res.ok) return await res.json();
  if (res.status !== 404) throw new Error(`shorts state R2 read failed: HTTP ${res.status}`);
  if (fs.existsSync(LOCAL)) return JSON.parse(fs.readFileSync(LOCAL, 'utf-8'));
  return { uploaded: {} };
}

export async function saveState(state) {
  await uploadJsonToR2(state, R2_KEY);                     // SSOT
  fs.writeFileSync(LOCAL, JSON.stringify(state, null, 2)); // 로컬 백업(관성)
}
