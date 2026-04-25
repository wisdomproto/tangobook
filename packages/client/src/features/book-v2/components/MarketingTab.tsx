import { useState } from 'react';
import {
  useBlogList,
  useCreateBlog,
  useDeleteBlog,
  useCardNewsList,
  useCreateCardNews,
  useDeleteCardNews,
} from '../hooks/useMarketing';
import type { BlogPostV2, BookManifest, CardNewsProjectV2 } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface MarketingTabProps {
  manifest: BookManifest;
}

export function MarketingTab({ manifest }: MarketingTabProps) {
  const [filterLang, setFilterLang] = useState<string>('');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-md p-4 shadow-soft">
        <h2 className="text-sm font-black text-ink-900 font-display">📰 마케팅 콘텐츠</h2>
        <p className="text-xs text-ink-500 font-bold mt-0.5 mb-3">
          블로그 글 + 카드뉴스 (언어별 별도)
        </p>
        <Field label="언어 필터">
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="input"
          >
            <option value="">전체</option>
            {manifest.usedVariants.languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <BlogSection manifest={manifest} filterLang={filterLang || undefined} />
      <CardNewsSection manifest={manifest} filterLang={filterLang || undefined} />

      <div className="bg-peach-50 rounded-md p-4 text-xs text-ink-700 font-bold leading-relaxed">
        💡 <strong>다음 sprint 기능 (3b-7d-ii)</strong>:
        <ul className="list-disc list-inside mt-2 space-y-1 font-normal">
          <li>Generate (Gemini로 본문/섹션 자동 생성, 동화책 컨텍스트 활용)</li>
          <li>리치텍스트 에디터 (블로그 섹션 편집)</li>
          <li>슬라이드 프리뷰 / Canvas PNG export (카드뉴스)</li>
          <li>SEO 점수 / 키워드 검색량 (블로그)</li>
        </ul>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Blog
// ────────────────────────────────────────────────────────────────────────────

function BlogSection({
  manifest,
  filterLang,
}: {
  manifest: BookManifest;
  filterLang: string | undefined;
}) {
  const { data: posts, isLoading } = useBlogList(manifest.id, filterLang);
  const create = useCreateBlog(manifest.id);
  const remove = useDeleteBlog(manifest.id);
  const [createOpen, setCreateOpen] = useState(false);

  const handleDelete = (postId: string) => {
    if (!window.confirm('이 블로그 글을 삭제할까요?')) return;
    remove.mutate(postId);
  };

  return (
    <section className="bg-white rounded-md p-5 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-ink-900 font-display">
          ✍️ 블로그 ({isLoading ? '...' : (posts?.length ?? 0)})
        </h3>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-3 py-1.5 rounded-md font-black text-xs bg-coral-500 text-white shadow-pop hover:brightness-110"
        >
          + 새 글
        </button>
      </div>

      {createOpen && (
        <CreateMarketingForm
          languages={manifest.usedVariants.languages}
          isPending={create.isPending}
          onSubmit={(language, title) =>
            create.mutate(
              { language, title },
              {
                onSuccess: () => setCreateOpen(false),
              }
            )
          }
          onCancel={() => setCreateOpen(false)}
          error={create.error}
        />
      )}

      {remove.isError && <ErrorBox>삭제 실패: {(remove.error as Error).message}</ErrorBox>}

      {!isLoading && posts && posts.length === 0 && (
        <p className="text-xs text-ink-300 font-bold py-2">블로그 글이 없습니다.</p>
      )}

      <div className="space-y-2">
        {posts?.map((p) => (
          <BlogCard key={p.id} post={p} onDelete={() => handleDelete(p.id)} />
        ))}
      </div>
    </section>
  );
}

function BlogCard({ post, onDelete }: { post: BlogPostV2; onDelete: () => void }) {
  return (
    <div className="border border-ink-100 rounded-md p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-peach-100 text-coral-600 font-mono font-bold text-[11px]">
            {post.language}
          </span>
          <span className="text-sm font-black text-ink-900 truncate">{post.title}</span>
          {typeof post.seoScore === 'number' && (
            <span className="text-[10px] font-bold text-success">SEO {post.seoScore}</span>
          )}
        </div>
        <div className="text-[11px] text-ink-500 font-bold mt-0.5 truncate">
          {post.id} · 섹션 {post.sections?.length ?? 0} · 태그 {post.tags?.length ?? 0} ·{' '}
          {new Date(post.createdAt).toLocaleString('ko-KR')}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="px-2 py-1 rounded-md bg-danger/10 text-danger font-bold text-xs hover:bg-danger/20 shrink-0"
      >
        🗑️
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Card News
// ────────────────────────────────────────────────────────────────────────────

function CardNewsSection({
  manifest,
  filterLang,
}: {
  manifest: BookManifest;
  filterLang: string | undefined;
}) {
  const { data: projects, isLoading } = useCardNewsList(manifest.id, filterLang);
  const create = useCreateCardNews(manifest.id);
  const remove = useDeleteCardNews(manifest.id);
  const [createOpen, setCreateOpen] = useState(false);

  const handleDelete = (projectId: string) => {
    if (!window.confirm('이 카드뉴스를 삭제할까요?')) return;
    remove.mutate(projectId);
  };

  return (
    <section className="bg-white rounded-md p-5 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-ink-900 font-display">
          🖼️ 카드뉴스 ({isLoading ? '...' : (projects?.length ?? 0)})
        </h3>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-3 py-1.5 rounded-md font-black text-xs bg-coral-500 text-white shadow-pop hover:brightness-110"
        >
          + 새 카드뉴스
        </button>
      </div>

      {createOpen && (
        <CreateMarketingForm
          languages={manifest.usedVariants.languages}
          isPending={create.isPending}
          onSubmit={(language, title) =>
            create.mutate(
              { language, title },
              {
                onSuccess: () => setCreateOpen(false),
              }
            )
          }
          onCancel={() => setCreateOpen(false)}
          error={create.error}
        />
      )}

      {remove.isError && <ErrorBox>삭제 실패: {(remove.error as Error).message}</ErrorBox>}

      {!isLoading && projects && projects.length === 0 && (
        <p className="text-xs text-ink-300 font-bold py-2">카드뉴스가 없습니다.</p>
      )}

      <div className="space-y-2">
        {projects?.map((p) => (
          <CardNewsCard key={p.id} project={p} onDelete={() => handleDelete(p.id)} />
        ))}
      </div>
    </section>
  );
}

function CardNewsCard({ project, onDelete }: { project: CardNewsProjectV2; onDelete: () => void }) {
  return (
    <div className="border border-ink-100 rounded-md p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-peach-100 text-coral-600 font-mono font-bold text-[11px]">
            {project.language}
          </span>
          <span className="px-2 py-0.5 rounded bg-cream-100 text-ink-700 font-mono font-bold text-[11px]">
            🎨 {project.colorTheme}
          </span>
          <span className="text-sm font-black text-ink-900 truncate">{project.title}</span>
        </div>
        <div className="text-[11px] text-ink-500 font-bold mt-0.5 truncate">
          {project.id} · 슬라이드 {project.slides?.length ?? 0} ·{' '}
          {new Date(project.createdAt).toLocaleString('ko-KR')}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="px-2 py-1 rounded-md bg-danger/10 text-danger font-bold text-xs hover:bg-danger/20 shrink-0"
      >
        🗑️
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 공통 — 블로그/카드뉴스 생성 인라인 폼
// ────────────────────────────────────────────────────────────────────────────

function CreateMarketingForm({
  languages,
  isPending,
  onSubmit,
  onCancel,
  error,
}: {
  languages: string[];
  isPending: boolean;
  onSubmit: (language: string, title: string) => void;
  onCancel: () => void;
  error: unknown;
}) {
  const [language, setLanguage] = useState<string>(languages[0] ?? 'ko');
  const [title, setTitle] = useState<string>('');

  return (
    <div className="border border-coral-200 bg-cream-50 rounded-md p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Field label="언어">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input">
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="제목 (선택)">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 없음"
            className="input"
          />
        </Field>
      </div>
      {error ? (
        <div className="bg-warn/10 border border-warn/30 rounded-md p-2 text-xs text-ink-700 font-bold whitespace-pre-line">
          {(error as Error).message}
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={isPending}
          className="px-3 py-1 rounded-md bg-ink-100 text-ink-700 font-bold text-xs hover:bg-ink-200"
        >
          취소
        </button>
        <button
          onClick={() => onSubmit(language, title)}
          disabled={isPending || !language}
          className={cn(
            'px-3 py-1 rounded-md font-black text-xs transition-all',
            isPending || !language
              ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
              : 'bg-coral-500 text-white shadow-pop hover:brightness-110'
          )}
        >
          {isPending ? '생성 중...' : '+ 만들기'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: import('react').ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-ink-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
      <style>{`
        .input {
          width: 100%;
          padding: 0.4rem 0.6rem;
          background: white;
          border: 1px solid var(--ink-200, #e2e8f0);
          border-radius: 0.375rem;
          font-size: 0.75rem;
          color: var(--ink-900, #0f172a);
          font-family: inherit;
        }
        .input:focus { outline: 2px solid var(--coral-400, #ff7e5f); outline-offset: -1px; }
      `}</style>
    </div>
  );
}

function ErrorBox({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="bg-danger/10 border border-danger/30 rounded-md p-3 text-sm text-danger font-bold">
      {children}
    </div>
  );
}
