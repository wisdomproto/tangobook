import React from 'react';
import { Series } from 'remotion';
import { MOSQUITO_PAGES, type EbookLang } from '../data/mosquito-ebook';
import { EbookPageScene } from '../components/ebook/EbookPageScene';
import { pageDurationFrames } from '../utils/ebook-timing';

/**
 * 전 페이지를 단일 타임라인(<Series>)으로. lang 으로 텍스트/오디오 스위치.
 * 웹은 현재 페이지 구간으로 seek 재생, mp4 는 전체 렌더 — 둘 다 이 컴포지션 하나.
 */
export const MosquitoEbookComposition: React.FC<{ lang: EbookLang; debugCoords?: boolean }> = ({
  lang,
  debugCoords,
}) => {
  return (
    <Series>
      {MOSQUITO_PAGES.map((page) => (
        <Series.Sequence
          key={page.page}
          durationInFrames={pageDurationFrames(page.ttsDurationSec[lang])}
        >
          <EbookPageScene page={page} lang={lang} debugCoords={debugCoords} />
        </Series.Sequence>
      ))}
    </Series>
  );
};
