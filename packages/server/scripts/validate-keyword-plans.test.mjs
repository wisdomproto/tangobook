import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PLAN_DIR = path.join(__dir, '_data', 'marketing', 'keyword-plans');

function listPlans() {
  if (!fs.existsSync(PLAN_DIR)) return [];
  return fs.readdirSync(PLAN_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
}

describe('keyword-plan 산출물 검증', () => {
  const files = listPlans();
  if (files.length === 0) {
    it('아직 작성된 키워드 플랜이 없음', () => expect(true).toBe(true));
  }
  it.each(files)('%s 는 필수 키 + 언어별 primary 를 만족한다', (file) => {
    const p = JSON.parse(fs.readFileSync(path.join(PLAN_DIR, file), 'utf8'));
    expect(file).toBe(`${p.storybookId}.json`);
    expect(['classic', 'nature']).toContain(p.category);
    expect(p.plans && typeof p.plans === 'object').toBe(true);
    for (const lang of Object.keys(p.plans)) {
      const plan = p.plans[lang];
      expect(plan.primary, `${file}:${lang} primary 누락`).toBeTruthy();
      expect(Array.isArray(plan.secondary)).toBe(true);
      expect(Array.isArray(plan.candidates)).toBe(true);
    }
  });
});
