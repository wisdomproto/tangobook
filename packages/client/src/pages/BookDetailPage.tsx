import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { Card } from '@/components/Card';
import { StateScreen } from '@/components/StateScreen';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/lib/cn';
import {
  hasVideoUrl,
  hasGames,
  getAvailableLanguages,
  type LangCode,
} from '@/lib/storybook-accessors';

const LANG_LABEL: Record<string, { flag: string; name: string }> = {
  ko: { flag: '🇰🇷', name: '한국어' },
  en: { flag: '🇺🇸', name: 'English' },
  ja: { flag: '🇯🇵', name: '日本語' },
};

export default function BookDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: storybook, isLoading, isError } = useStorybook(id);
  const [lang, setLang] = useState<LangCode>('ko');

  const videoAvailable = useMemo(() => (storybook ? hasVideoUrl(storybook) : false), [storybook]);
  const gameAvailable = useMemo(() => (storybook ? hasGames(storybook) : false), [storybook]);
  const languages = useMemo(() => (storybook ? getAvailableLanguages(storybook) : []), [storybook]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 p-7 max-w-[1200px] mx-auto">
        <Skeleton className="h-12 w-32 mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-9">
          <Skeleton className="aspect-[3/4] rounded-lg" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !storybook) {
    return (
      <StateScreen
        mascotState="sad"
        title="이 책을 찾을 수 없어"
        description="다른 책 볼래?"
        action={{ label: '🏠 라이브러리로', onClick: () => navigate('/library') }}
      />
    );
  }

  const pageCount = storybook.pages?.length ?? 0;
  const summary = storybook.referenceContent?.slice(0, 150) ?? '';

  const enterMode = (mode: 'read' | 'video' | 'game') => {
    const qs = new URLSearchParams({ lang });
    if (mode !== 'read') qs.set('mode', mode === 'game' ? 'games' : 'video');
    navigate(`/viewer/${storybook.id}?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="max-w-[1200px] mx-auto p-5 md:p-7">
        {/* 상단 바 */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-lg bg-white shadow-soft flex items-center justify-center text-xl hover:bg-peach-100"
            aria-label="뒤로 가기"
          >
            ←
          </button>
          <button
            disabled
            title="즐겨찾기는 곧 추가돼요"
            className="bg-white rounded-lg px-4 py-3 shadow-soft font-bold text-sm flex items-center gap-1.5 opacity-60 cursor-not-allowed"
          >
            ⭐ <span>즐겨찾기</span>
          </button>
        </div>

        {/* 히어로 */}
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-9 items-start mb-6">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-br from-peach-200 to-peach-300 shadow-card">
            {storybook.coverImage ? (
              <img
                src={storybook.coverImage}
                alt={storybook.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[140px]">📖</div>
            )}
            {videoAvailable && (
              <span className="absolute top-3 right-3 bg-coral-500 text-white px-3 py-1.5 rounded-md text-[11px] font-black shadow-pop">
                📺 영상 있음
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-ink-900 font-display leading-tight">
              {storybook.title}
            </h1>
            <div className="flex gap-2 flex-wrap mt-4 mb-4">
              {[
                `👶 만 ${storybook.targetAge}세`,
                `📄 ${pageCount}페이지`,
                storybook.category && `🏷️ ${storybook.category}`,
              ]
                .filter(Boolean)
                .map((chip) => (
                  <span
                    key={chip as string}
                    className="bg-white px-3 py-1.5 rounded-md text-xs font-bold text-ink-700 shadow-soft"
                  >
                    {chip}
                  </span>
                ))}
            </div>
            {summary && (
              <p className="bg-white/60 p-4 rounded-md text-sm text-ink-700 leading-relaxed">
                {summary}
                {summary.length >= 150 ? '…' : ''}
              </p>
            )}
          </div>
        </div>

        {/* 언어 선택 */}
        {languages.length > 1 && (
          <div className="mb-6">
            <div className="text-xs font-black text-ink-500 uppercase tracking-wider mb-2">
              🌐 언어
            </div>
            <div className="flex gap-2 flex-wrap">
              {languages.map((code) => {
                const label = LANG_LABEL[code] ?? { flag: '🌐', name: code };
                return (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={cn(
                      'px-5 py-3 rounded-md font-bold flex gap-2 items-center transition-all',
                      lang === code
                        ? 'bg-peach-300 text-ink-900 shadow-soft'
                        : 'bg-white text-ink-500'
                    )}
                  >
                    <span className="text-lg">{label.flag}</span>
                    <span>{label.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 모드 선택 */}
        <div>
          <div className="text-xs font-black text-ink-500 uppercase tracking-wider mb-3">
            🎯 어떻게 즐길까?
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
            {/* 책으로 읽기 — primary */}
            <Card
              interactive
              onClick={() => enterMode('read')}
              className="!bg-gradient-to-br !from-coral-400 !to-coral-500 !text-white"
            >
              <div className="text-5xl">📖</div>
              <h3 className="font-black text-lg mt-2">책으로 읽기</h3>
              <div className="text-sm opacity-95">그림과 글로 천천히 읽어요</div>
            </Card>
            {/* 영상으로 */}
            {videoAvailable && (
              <Card interactive onClick={() => enterMode('video')}>
                <div className="text-4xl">🎬</div>
                <h3 className="font-black text-base mt-2 text-ink-900">영상으로</h3>
                <div className="text-xs text-ink-500 mt-0.5">움직이는 그림으로</div>
              </Card>
            )}
            {/* 게임 */}
            {gameAvailable && (
              <Card interactive onClick={() => enterMode('game')}>
                <div className="text-4xl">🎮</div>
                <h3 className="font-black text-base mt-2 text-ink-900">게임</h3>
                <div className="text-xs text-ink-500 mt-0.5">퀴즈·연결하기</div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
