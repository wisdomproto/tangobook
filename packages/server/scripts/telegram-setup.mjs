#!/usr/bin/env node
/**
 * 텔레그램 알림 셋업 도우미.
 *
 * 발행기가 2주에 한 번 돌고 나면 결과를 형 폰으로 보낸다. 그러려면 두 값이 필요하다:
 *   TELEGRAM_BOT_TOKEN  — @BotFather 가 발급
 *   TELEGRAM_CHAT_ID    — 형과 봇의 대화방 id (이 스크립트가 찾아준다)
 *
 * 사용:
 *   1) 텔레그램에서 @BotFather → /newbot → 이름 정하면 토큰이 나온다
 *   2) packages/server/.env 에 TELEGRAM_BOT_TOKEN=... 추가
 *   3) 만든 봇과의 대화방을 열어 아무 말이나 한 마디 보낸다 ("hi")
 *   4) node scripts/telegram-setup.mjs        → chat id 를 찾아 알려준다
 *   5) .env 에 TELEGRAM_CHAT_ID=... 추가
 *   6) node scripts/telegram-setup.mjs --test → 테스트 메시지 발송
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(ENV, 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
const test = process.argv.includes('--test');

if (!TOKEN) {
  console.log(`
TELEGRAM_BOT_TOKEN 이 없습니다.

  1) 텔레그램에서 @BotFather 를 찾아 대화 시작
  2) /newbot  → 봇 이름·아이디 입력
  3) 나온 토큰을 packages/server/.env 에 추가:

     TELEGRAM_BOT_TOKEN=123456789:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

  4) 만든 봇과의 대화방에서 아무 말이나 한 마디 보내고
  5) 이 스크립트를 다시 실행하세요.
`);
  process.exit(1);
}

const api = (m, q = '') => `https://api.telegram.org/bot${TOKEN}/${m}${q}`;

if (test) {
  if (!CHAT) {
    console.error('TELEGRAM_CHAT_ID 가 없습니다 — --test 없이 먼저 실행해 chat id 를 받으세요.');
    process.exit(1);
  }
  const res = await fetch(api('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT,
      text: '🐯 탱고북 네이버 발행기 — 알림 연결됐습니다.',
    }),
  });
  const j = await res.json();
  console.log(j.ok ? '✅ 발송 성공 — 텔레그램을 확인하세요.' : `✗ 실패: ${JSON.stringify(j)}`);
  process.exit(j.ok ? 0 : 1);
}

// chat id 찾기 — 봇에게 보낸 최근 메시지에서 뽑는다
const res = await fetch(api('getUpdates'));
const j = await res.json();
if (!j.ok) {
  console.error(`✗ 토큰이 거부됐습니다: ${JSON.stringify(j).slice(0, 200)}`);
  process.exit(1);
}
const chats = new Map();
for (const u of j.result ?? []) {
  const c = u.message?.chat ?? u.channel_post?.chat;
  if (c) chats.set(c.id, c.username || c.first_name || c.title || '');
}
if (!chats.size) {
  console.log('아직 메시지가 없습니다 — 봇과의 대화방에서 아무 말이나 보내고 다시 실행하세요.');
  process.exit(1);
}
console.log('찾은 대화방:');
for (const [id, name] of chats) console.log(`  TELEGRAM_CHAT_ID=${id}   (${name})`);
console.log('\n위 줄을 packages/server/.env 에 추가한 뒤 `--test` 로 확인하세요.');
