import { describe, expect, it } from 'vitest';
import type { Storybook } from '@tangobook/shared';
import catalog from '../data/scene-coloring-catalog.json';
import { editorSceneColoringItem, type EditorColoringScene } from './editor-scene-coloring';

const scene: EditorColoringScene = {
  key: 'book-p13',
  bookId: 'book',
  pageNumber: 13,
  lineartUrl: 'https://assets.test/line.png?v=abc',
  colorSourceUrl: 'https://assets.test/source.png?v=def',
  text: '저장된 본문',
  ttsUrl: 'old.mp3',
  colorSampling: 'median',
  translations: { en: { text: 'Stored English', ttsUrl: 'stored-en.mp3' } },
};
const book = {
  id: 'book',
  title: '고양이_그림체1',
  pages: [
    { pageNumber: 3, text: '다른 쪽' },
    {
      pageNumber: 13,
      text: '편집한 본문',
      ttsUrl: 'current.mp3',
      translations: {
        en: { text: 'Current English', ttsUrl: 'current-en.mp3' },
      },
    },
  ],
} as Storybook;

describe('editor2 장면 색칠 연결', () => {
  it('창작동화 1~19를 포함한 1215권 2430장의 공개 도안을 책 ID에 두 장씩 연결한다', () => {
    expect(Object.keys(catalog)).toHaveLength(1215);
    const keys = new Set();
    for (const [id, scenes] of Object.entries(catalog)) {
      expect(scenes).toHaveLength(2);
      for (const s of scenes) {
        expect(s.bookId).toBe(id);
        expect(s.lineartUrl).toMatch(/\?v=[a-f0-9]{12}$/);
        expect(s.colorSourceUrl).toMatch(/\?v=[a-f0-9]{12}$/);
        keys.add(s.key);
      }
    }
    expect(keys.size).toBe(2430);
    const pongiBooks = Object.entries(catalog).filter(([id]) => /^changjak-pongi-\d{2}$/.test(id));
    expect(pongiBooks).toHaveLength(50);
    for (let number = 1; number <= 50; number++) {
      const id = `changjak-pongi-${String(number).padStart(2, '0')}`;
      const scenes = pongiBooks.find(([bookId]) => bookId === id)?.[1];
      expect(scenes).toHaveLength(2);
      expect(scenes?.every((s) => s.key.startsWith(id + '-p'))).toBe(true);
    }
    for (const [series, count] of [
      ['coco', 50],
      ['mei', 50],
      ['dodo', 50],
      ['bruno', 50],
      ['twins', 50],
      ['mio', 50],
      ['pipo', 50],
      ['nono', 50],
      ['lulu', 50],
      ['bung', 50],
      ['dingding', 50],
      ['taro', 50],
      ['yuki', 50],
      ['mina', 50],
      ['kota', 25],
      ['moya', 25],
      ['bami', 25],
      ['dari', 25],
    ] as const) {
      const seriesBooks = Object.keys(catalog).filter((id) => id.startsWith(`changjak-${series}-`));
      expect(seriesBooks).toHaveLength(count);
      for (let number = 1; number <= count; number++) {
        const id = `changjak-${series}-${String(number).padStart(2, '0')}`;
        const scenes = Object.entries(catalog).find(([bookId]) => bookId === id)?.[1];
        expect(scenes).toHaveLength(2);
        expect(scenes?.every((s) => s.key.startsWith(id + '-p'))).toBe(true);
      }
    }
  });
  it('쪽 번호로 현재 본문과 음원을 선택하고 검수된 원본 좌표와 명시 median을 보존한다', () => {
    const item = editorSceneColoringItem(scene, book, 'ko');
    expect(item?.scene).toMatchObject({
      pageNumber: 13,
      text: '편집한 본문',
      ttsUrl: 'current.mp3',
      colorSampling: 'median',
      illustrationUrl: scene.colorSourceUrl,
    });
    expect(item?.colorSourceUrl).toBe(scene.colorSourceUrl);
  });
  it('언어 전환은 해당 쪽 번역을 읽으며 번역이 없으면 한국어로 대체하지 않는다', () => {
    expect(editorSceneColoringItem(scene, book, 'en')).toMatchObject({
      lang: 'en',
      language: 'english',
      scene: { text: 'Current English', ttsUrl: 'current-en.mp3' },
    });
    expect(editorSceneColoringItem(scene, book, 'vi')).toBeNull();
  });
  it('미제공 음원과 기본 mode를 그대로 유지한다', () => {
    const item = editorSceneColoringItem(
      { ...scene, colorSampling: undefined },
      {
        ...book,
        pages: [{ pageNumber: 13, text: '음원 없는 본문' } as Storybook['pages'][number]],
      },
      'ko'
    );
    expect(item?.scene?.ttsUrl).toBeUndefined();
    expect(item?.scene?.colorSampling).toBeUndefined();
  });
  it('다른 그림체 책의 도안을 가져오지 않는다', () => {
    expect(editorSceneColoringItem(scene, { ...book, id: 'other' }, 'ko')).toBeNull();
  });
});
