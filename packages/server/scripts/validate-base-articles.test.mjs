import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyByPageCount } from './lib/seed-helpers.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ART_DIR = path.join(__dir, '_data', 'marketing', 'base-articles');
const VI_DIR = path.join(__dir, '_data', 'translations', 'vi');

function listArticles() {
  if (!fs.existsSync(ART_DIR)) return [];
  return fs.readdirSync(ART_DIR).filter((f) => f.endsWith('.json'));
}

describe('base-article 산출물 검증', () => {
  const files = listArticles();

  if (files.length === 0) {
    it('아직 작성된 기본글이 없음', () => {
      expect(true).toBe(true);
    });
  }

  it.each(files)('%s 는 필수 키 + 정합성을 만족한다', (file) => {
    const art = JSON.parse(fs.readFileSync(path.join(ART_DIR, file), 'utf8'));
    for (const k of ['storybookId', 'category', 'title', 'body_html', 'body_plain_text']) {
      expect(art[k], `${file}: ${k} 누락`).toBeTruthy();
    }
    expect(file).toBe(`${art.storybookId}.json`);
    expect(['classic', 'nature', 'life']).toContain(art.category);
    const srcPath = path.join(VI_DIR, `${art.storybookId}.json`);
    expect(fs.existsSync(srcPath), `${file}: 원본 동화책 없음`).toBe(true);
    const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
    // life(생활동화)는 페이지수 버킷이 아니라 별개 콘텐츠 라인이라 페이지수 대조 대상이 아니다.
    if (art.category !== 'life')
      expect(art.category).toBe(classifyByPageCount((src.pages || []).length));
    const h2count = (art.body_html.match(/<h2/gi) || []).length;
    expect(h2count, `${file}: h2 섹션 ${h2count}개 (>=5 필요)`).toBeGreaterThanOrEqual(5);
  });
});
