import fs from 'node:fs';
import path from 'node:path';
import type { Page } from 'puppeteer';

export interface NaverSession {
  savedAt: string; // ISO
  cookies: unknown[]; // puppeteer Protocol.Network.CookieParam[]
  localStorage: Record<string, string>;
}

const SESSION_PATH = path.resolve(process.cwd(), 'naver-session.json');
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function isSessionExpired(s: NaverSession, now: Date = new Date()): boolean {
  return now.getTime() - new Date(s.savedAt).getTime() > MAX_AGE_MS;
}

export function loadSession(): NaverSession | null {
  if (!fs.existsSync(SESSION_PATH)) return null;
  return JSON.parse(fs.readFileSync(SESSION_PATH, 'utf-8')) as NaverSession;
}

/** 로그인된 page 에서 쿠키+localStorage 를 뽑아 저장. (부수효과) */
export async function saveSessionFromPage(page: Page): Promise<void> {
  const cookies = await page.cookies();
  const localStorage = await page.evaluate(() => {
    // 브라우저 컨텍스트(page.evaluate) — globalThis === window. server eslint 는 window 미인지라 globalThis 사용.
    const ls = globalThis.localStorage;
    const out: Record<string, string> = {};
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i)!;
      out[k] = ls.getItem(k) ?? '';
    }
    return out;
  });
  const session: NaverSession = { savedAt: new Date().toISOString(), cookies, localStorage };
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2), 'utf-8');
}

/**
 * 저장 세션을 새 page 에 완전 복원. (부수효과)
 * 쿠키 set → naver origin 으로 goto → localStorage 복원 순서를 이 헬퍼가 스스로 책임진다.
 * ⚠️ localStorage 는 origin-scoped 라 반드시 naver.com 으로 이동한 "뒤" 에 setItem 해야 값이
 * 네이버 origin 에 들어간다(about:blank 에서 하면 무의미). 그래서 goto 를 헬퍼 안에 넣어
 * 호출부가 순서를 틀릴 여지를 없앤다. 반환 후 page 는 blog.naver.com 에 있다.
 */
export async function applySession(page: Page, s: NaverSession): Promise<void> {
  if (s.cookies.length) await page.setCookie(...(s.cookies as never[]));
  await page.goto('https://blog.naver.com', { waitUntil: 'domcontentloaded' });
  await page.evaluate((ls: Record<string, string>) => {
    for (const [k, v] of Object.entries(ls)) globalThis.localStorage.setItem(k, v);
  }, s.localStorage);
}
