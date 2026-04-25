import { useEffect, useState } from 'react';
import { useUpdateBookMeta, usePatchVariants } from '../hooks/useBookMutations';
import type { UpdateBookMetaPatch } from '../api/book-v2.api';
import { ART_STYLES } from '@tangobook/shared';
import type { BookManifest, ParentGuide, CurriculumMeta, ReadingLevel } from '@tangobook/shared';
import { cn } from '@/lib/cn';

const ALL_LEVELS: ReadingLevel[] = ['L1', 'L2', 'L3', 'L4'];
const COMMON_LANGS = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文(简体)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
];

interface MetaTabProps {
  manifest: BookManifest;
}

export function MetaTab({ manifest }: MetaTabProps) {
  const [title, setTitle] = useState(manifest.title);
  const [category, setCategory] = useState(manifest.category ?? '');
  const [folder, setFolder] = useState(manifest.folder ?? '');
  const [isPublic, setIsPublic] = useState(manifest.isPublic ?? false);
  const [parentGuide, setParentGuide] = useState<ParentGuide>(
    manifest.parentGuide ?? { overview: '', lessons: [''], readingTips: [''] }
  );
  const [curriculumMeta, setCurriculumMeta] = useState<CurriculumMeta>(
    manifest.curriculumMeta ?? {}
  );

  // manifest 변경 시 동기화 (외부 update 또는 책 전환)
  useEffect(() => {
    setTitle(manifest.title);
    setCategory(manifest.category ?? '');
    setFolder(manifest.folder ?? '');
    setIsPublic(manifest.isPublic ?? false);
    setParentGuide(manifest.parentGuide ?? { overview: '', lessons: [''], readingTips: [''] });
    setCurriculumMeta(manifest.curriculumMeta ?? {});
  }, [manifest.id, manifest.updatedAt]);

  const updateMeta = useUpdateBookMeta(manifest.id);
  const patchVariants = usePatchVariants(manifest.id);

  const dirty =
    title !== manifest.title ||
    category !== (manifest.category ?? '') ||
    folder !== (manifest.folder ?? '') ||
    isPublic !== (manifest.isPublic ?? false) ||
    JSON.stringify(parentGuide) !==
      JSON.stringify(manifest.parentGuide ?? { overview: '', lessons: [''], readingTips: [''] }) ||
    JSON.stringify(curriculumMeta) !== JSON.stringify(manifest.curriculumMeta ?? {});

  const handleSave = () => {
    const patch: UpdateBookMetaPatch = {
      title,
      category: category || undefined,
      folder: folder || undefined,
      isPublic,
      parentGuide:
        parentGuide.overview ||
        parentGuide.lessons.some(Boolean) ||
        parentGuide.readingTips.some(Boolean)
          ? {
              overview: parentGuide.overview,
              lessons: parentGuide.lessons.filter(Boolean),
              readingTips: parentGuide.readingTips.filter(Boolean),
            }
          : undefined,
      curriculumMeta: Object.keys(curriculumMeta).length > 0 ? curriculumMeta : undefined,
    };
    updateMeta.mutate(patch);
  };

  const setLessonAt = (i: number, v: string) => {
    setParentGuide((g) => ({ ...g, lessons: g.lessons.map((x, j) => (j === i ? v : x)) }));
  };
  const setTipAt = (i: number, v: string) => {
    setParentGuide((g) => ({ ...g, readingTips: g.readingTips.map((x, j) => (j === i ? v : x)) }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 저장 바 */}
      <div className="flex items-center justify-between bg-white rounded-md p-4 shadow-soft">
        <div className="text-sm text-ink-500 font-bold">
          {dirty ? '🟡 변경됨' : updateMeta.isPending ? '저장 중...' : '✓ 저장됨'}
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || updateMeta.isPending}
          className={cn(
            'px-5 py-2 rounded-md font-black text-sm transition-all',
            dirty && !updateMeta.isPending
              ? 'bg-coral-500 text-white shadow-pop hover:brightness-110'
              : 'bg-ink-100 text-ink-300 cursor-not-allowed'
          )}
        >
          💾 저장
        </button>
      </div>

      {updateMeta.isError && (
        <div className="bg-danger/10 border border-danger/30 rounded-md p-3 text-sm text-danger font-bold">
          저장 실패: {(updateMeta.error as Error)?.message}
        </div>
      )}

      {/* 기본 정보 */}
      <Section title="📋 기본 정보">
        <Field label="제목">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="카테고리">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="명작 / 자연관찰 / ..."
              className="input"
            />
          </Field>
          <Field label="폴더">
            <input
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="완성 / 진행 / ..."
              className="input"
            />
          </Field>
        </div>
        <Field label="공개 여부">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold">
              {isPublic ? '🌐 라이브러리에 공개' : '🔒 비공개'}
            </span>
          </label>
        </Field>
      </Section>

      {/* usedVariants 매트릭스 */}
      <Section title="📂 변형 화이트리스트 (usedVariants)">
        <VariantMatrix
          manifest={manifest}
          onPatch={(p) => patchVariants.mutate(p)}
          pending={patchVariants.isPending}
        />
      </Section>

      {/* parentGuide */}
      <Section title="👨‍👩‍👧 부모님 가이드">
        <Field label="책의 특징 (overview)">
          <textarea
            rows={2}
            value={parentGuide.overview}
            onChange={(e) => setParentGuide((g) => ({ ...g, overview: e.target.value }))}
            className="input"
            placeholder="원전·저자·배경 1-2문장"
          />
        </Field>
        <Field label="아이에게 전할 교훈 (lessons)">
          {parentGuide.lessons.map((l, i) => (
            <input
              key={i}
              value={l}
              onChange={(e) => setLessonAt(i, e.target.value)}
              placeholder={`교훈 ${i + 1}`}
              className="input mb-1.5"
            />
          ))}
          <button
            onClick={() => setParentGuide((g) => ({ ...g, lessons: [...g.lessons, ''] }))}
            className="text-xs text-coral-500 font-bold hover:underline"
          >
            + 교훈 추가
          </button>
        </Field>
        <Field label="읽어주는 법 (readingTips)">
          {parentGuide.readingTips.map((t, i) => (
            <input
              key={i}
              value={t}
              onChange={(e) => setTipAt(i, e.target.value)}
              placeholder={`팁 ${i + 1}`}
              className="input mb-1.5"
            />
          ))}
          <button
            onClick={() => setParentGuide((g) => ({ ...g, readingTips: [...g.readingTips, ''] }))}
            className="text-xs text-coral-500 font-bold hover:underline"
          >
            + 팁 추가
          </button>
        </Field>
      </Section>

      {/* curriculumMeta */}
      <Section title="📚 커리큘럼 메타">
        <div className="grid grid-cols-2 gap-3">
          <Field label="순서 (no)">
            <input
              type="number"
              value={curriculumMeta.no ?? ''}
              onChange={(e) =>
                setCurriculumMeta((c) => ({
                  ...c,
                  no: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              className="input"
            />
          </Field>
          <Field label="우선순위 (priority)">
            <select
              value={curriculumMeta.priority ?? ''}
              onChange={(e) =>
                setCurriculumMeta((c) => ({
                  ...c,
                  priority: e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : undefined,
                }))
              }
              className="input"
            >
              <option value="">—</option>
              <option value="1">1순위</option>
              <option value="2">2순위</option>
              <option value="3">3순위</option>
            </select>
          </Field>
        </div>
        <Field label="원제 (originalTitle)">
          <input
            value={curriculumMeta.originalTitle ?? ''}
            onChange={(e) =>
              setCurriculumMeta((c) => ({ ...c, originalTitle: e.target.value || undefined }))
            }
            className="input"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="저자 (author)">
            <input
              value={curriculumMeta.author ?? ''}
              onChange={(e) =>
                setCurriculumMeta((c) => ({ ...c, author: e.target.value || undefined }))
              }
              className="input"
            />
          </Field>
          <Field label="국가 (country)">
            <input
              value={curriculumMeta.country ?? ''}
              onChange={(e) =>
                setCurriculumMeta((c) => ({ ...c, country: e.target.value || undefined }))
              }
              className="input"
            />
          </Field>
          <Field label="연도 (year)">
            <input
              value={curriculumMeta.year ?? ''}
              onChange={(e) =>
                setCurriculumMeta((c) => ({ ...c, year: e.target.value || undefined }))
              }
              className="input"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="원전 카테고리 (source)">
            <input
              value={curriculumMeta.source ?? ''}
              onChange={(e) =>
                setCurriculumMeta((c) => ({ ...c, source: e.target.value || undefined }))
              }
              placeholder="그림형제 / 안데르센 / 이솝 / ..."
              className="input"
            />
          </Field>
          <Field label="런칭 레벨 (launchLevel)">
            <select
              value={curriculumMeta.launchLevel ?? ''}
              onChange={(e) =>
                setCurriculumMeta((c) => ({
                  ...c,
                  launchLevel: (e.target.value as ReadingLevel) || undefined,
                }))
              }
              className="input"
            >
              <option value="">—</option>
              {ALL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: white;
          border: 1px solid var(--ink-200, #e2e8f0);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: var(--ink-900, #0f172a);
          font-family: inherit;
        }
        .input:focus { outline: 2px solid var(--coral-400, #ff7e5f); outline-offset: -1px; }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: import('react').ReactNode }) {
  return (
    <section className="bg-white rounded-md p-5 shadow-soft space-y-3">
      <h2 className="text-sm font-black text-ink-900 font-display">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: import('react').ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-black text-ink-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function VariantMatrix({
  manifest,
  onPatch,
  pending,
}: {
  manifest: BookManifest;
  onPatch: (p: import('../api/book-v2.api').VariantPatch) => void;
  pending: boolean;
}) {
  const v = manifest.usedVariants;
  return (
    <div className="space-y-3 text-sm">
      <Row
        title="레벨"
        items={ALL_LEVELS}
        active={v.levels}
        renderLabel={(l) => l}
        onAdd={(l) => onPatch({ addLevels: [l as ReadingLevel] })}
        onRemove={(l) => onPatch({ removeLevels: [l as ReadingLevel] })}
        pending={pending}
      />
      <Row
        title="언어"
        items={COMMON_LANGS.map((l) => l.code)}
        active={v.languages}
        renderLabel={(c) => COMMON_LANGS.find((l) => l.code === c)?.label ?? c}
        onAdd={(c) => onPatch({ addLanguages: [c] })}
        onRemove={(c) => onPatch({ removeLanguages: [c] })}
        pending={pending}
      />
      <Row
        title="그림체"
        items={ART_STYLES.map((s) => s.id)}
        active={v.styles}
        renderLabel={(s) => ART_STYLES.find((x) => x.id === s)?.label ?? s}
        onAdd={(s) => onPatch({ addStyles: [s] })}
        onRemove={(s) => onPatch({ removeStyles: [s] })}
        pending={pending}
      />
    </div>
  );
}

function Row({
  title,
  items,
  active,
  renderLabel,
  onAdd,
  onRemove,
  pending,
}: {
  title: string;
  items: readonly string[];
  active: string[];
  renderLabel: (id: string) => string;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  pending: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-black text-ink-500 uppercase tracking-wider mb-1">
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((id) => {
          const isActive = active.includes(id);
          return (
            <button
              key={id}
              onClick={() => (isActive ? onRemove(id) : onAdd(id))}
              disabled={pending}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-bold transition-all',
                isActive
                  ? 'bg-coral-500 text-white shadow-soft hover:bg-coral-600'
                  : 'bg-peach-50 text-ink-500 hover:bg-peach-100',
                pending && 'opacity-50 cursor-wait'
              )}
              title={isActive ? '클릭하여 제거' : '클릭하여 추가'}
            >
              {isActive && '✓ '}
              {renderLabel(id)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
