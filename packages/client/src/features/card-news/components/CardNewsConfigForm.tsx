import { useState } from 'react';
import type { Storybook, BlogPost } from '@tangobook/shared';
import { CARD_NEWS_THEMES } from '@tangobook/shared';

export type CardNewsSource = { type: 'storybook' } | { type: 'blog'; blogPostId: string };

export interface CardNewsGenerateConfig {
  source: CardNewsSource;
  colorTheme: string;
  slideCount: number;
}

interface CardNewsConfigFormProps {
  storybook: Storybook;
  onGenerate: (config: CardNewsGenerateConfig) => void;
  onCancel: () => void;
  generating: boolean;
}

export function CardNewsConfigForm({
  storybook,
  onGenerate,
  onCancel,
  generating,
}: CardNewsConfigFormProps) {
  const [sourceType, setSourceType] = useState<'storybook' | 'blog'>('storybook');
  const [selectedBlogId, setSelectedBlogId] = useState<string>('');
  const [colorTheme, setColorTheme] = useState<string>(CARD_NEWS_THEMES[0].id);
  const [blogSlideCount, setBlogSlideCount] = useState(8);

  const blogPosts: BlogPost[] = storybook.blogPosts ?? [];
  const selectedTheme = CARD_NEWS_THEMES.find((t) => t.id === colorTheme) ?? CARD_NEWS_THEMES[0];
  const pageCount = (storybook.pages ?? []).length;
  // 전체 삽화 소스: 표지(1) + 페이지별(pageCount), 블로그 소스: 사용자 선택
  const slideCount = sourceType === 'storybook' ? pageCount + 1 : blogSlideCount;

  const canGenerate = sourceType === 'storybook' || (sourceType === 'blog' && selectedBlogId);

  const handleSubmit = () => {
    if (!canGenerate) return;
    const source: CardNewsSource =
      sourceType === 'blog' && selectedBlogId
        ? { type: 'blog', blogPostId: selectedBlogId }
        : { type: 'storybook' };
    onGenerate({ source, colorTheme, slideCount });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 dark:text-white">카드뉴스 생성 설정</h2>
        <button
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          ← 목록으로
        </button>
      </div>

      {/* 소스 선택 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          콘텐츠 소스
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSourceType('storybook')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              sourceType === 'storybook'
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
          >
            <div className="text-2xl mb-2">📖</div>
            <div className="text-sm font-semibold text-slate-800 dark:text-white">
              전체 삽화 & 텍스트
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              동화책의 전체 페이지, 삽화, 캐릭터를 활용하여 카드뉴스 생성
            </p>
          </button>

          <button
            onClick={() => setSourceType('blog')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              sourceType === 'blog'
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm font-semibold text-slate-800 dark:text-white">
              블로그 글 기반
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              작성된 블로그 글의 내용을 카드뉴스 슬라이드로 변환
            </p>
          </button>
        </div>
      </div>

      {/* 블로그 선택 (blog 소스일 때만) */}
      {sourceType === 'blog' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            블로그 글 선택
          </label>
          {blogPosts.length === 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                블로그 글이 없습니다. 먼저 블로그 탭에서 글을 생성해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {blogPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedBlogId(post.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedBlogId === post.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="text-sm font-medium text-slate-800 dark:text-white truncate">
                    {post.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {post.summary}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {post.sections.length}개 섹션 ·{' '}
                    {post.tags
                      .slice(0, 3)
                      .map((t) => `#${t}`)
                      .join(' ')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 테마 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          색상 테마
        </label>
        <div className="flex flex-wrap gap-2">
          {CARD_NEWS_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setColorTheme(theme.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                colorTheme === theme.id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full border border-slate-300"
                style={{ backgroundColor: theme.bg }}
              />
              <span className="text-xs text-slate-700 dark:text-slate-200">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 슬라이드 수 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          슬라이드 수
        </label>
        {sourceType === 'storybook' ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
              {slideCount}장
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (표지 1장 + 페이지 {pageCount}장 — 자동 계산)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {[5, 7, 8, 10].map((n) => (
              <button
                key={n}
                onClick={() => setBlogSlideCount(n)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  blogSlideCount === n
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {n}장
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 미리보기 (선택된 테마) */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: selectedTheme.bg, color: selectedTheme.text }}
        >
          미리보기
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <p>테마: {selectedTheme.label}</p>
          <p>
            슬라이드: {slideCount}장{' '}
            {sourceType === 'storybook'
              ? `(표지 1 + 페이지 ${pageCount})`
              : '(표지 + 본문 + 아웃트로)'}
          </p>
          <p>소스: {sourceType === 'storybook' ? '동화책 전체 삽화 & 텍스트' : '블로그 글 기반'}</p>
        </div>
      </div>

      {/* 생성 버튼 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={!canGenerate || generating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <span className="animate-spin">⏳</span> 생성 중...
            </>
          ) : (
            <>✨ 카드뉴스 생성</>
          )}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          취소
        </button>
      </div>
    </div>
  );
}
