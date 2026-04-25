import { useEffect, useRef, useState } from 'react';
import {
  useStyleSlice,
  useSaveCharacters,
  useUploadCover,
  useUploadKeyObjectImage,
  useUploadVocabImage,
} from '../hooks/useStyleSlice';
import type { BookManifest, BookCharacter } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface StyleTabProps {
  manifest: BookManifest;
  style: string | null;
}

export function StyleTab({ manifest, style }: StyleTabProps) {
  if (!style) {
    return (
      <Centered>
        <p className="text-sm text-ink-500 font-bold">상단에서 그림체를 선택해주세요.</p>
        <p className="text-xs text-ink-300 mt-2">
          그림체가 없으면 메타 탭의 "변형 화이트리스트"에서 추가하세요.
        </p>
      </Centered>
    );
  }
  return <StyleEditor manifest={manifest} style={style} />;
}

function StyleEditor({ manifest, style }: { manifest: BookManifest; style: string }) {
  const { data: slice, isLoading, isError, error } = useStyleSlice(manifest.id, style);
  const saveChars = useSaveCharacters(manifest.id, style);
  const uploadCover = useUploadCover(manifest.id, style);
  const uploadKeyObj = useUploadKeyObjectImage(manifest.id, style);
  const uploadVocab = useUploadVocabImage(manifest.id, style);

  const [characters, setCharacters] = useState<BookCharacter[]>([]);

  useEffect(() => {
    if (slice) setCharacters(slice.characters);
  }, [slice]);

  const notFound = isError && /404|not found/i.test((error as Error)?.message ?? '');

  if (isLoading) return <Centered>로딩 중...</Centered>;
  if (isError && !notFound) return <Centered>오류: {(error as Error)?.message}</Centered>;

  const dirty = slice && JSON.stringify(characters) !== JSON.stringify(slice.characters);

  const addCharacter = () => {
    setCharacters((cs) => [
      ...cs,
      {
        id: `c${cs.length + 1}`,
        name: '',
        description: '',
        role: '',
        height: 100,
      } as BookCharacter,
    ]);
  };

  const updateChar = (idx: number, patch: Partial<BookCharacter>) => {
    setCharacters((cs) => cs.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const removeChar = (idx: number) => {
    setCharacters((cs) => cs.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 상단 바 */}
      <div className="flex items-center justify-between bg-white rounded-md p-4 shadow-soft">
        <div className="text-sm text-ink-500 font-bold">
          🎨 그림체: <span className="text-ink-900 font-mono">{style}</span>
          {notFound && <span className="ml-2 text-warn">· 신규 슬라이스</span>}
        </div>
        <button
          onClick={() => saveChars.mutate(characters)}
          disabled={!dirty || saveChars.isPending}
          className={cn(
            'px-5 py-2 rounded-md font-black text-sm transition-all',
            dirty && !saveChars.isPending
              ? 'bg-coral-500 text-white shadow-pop hover:brightness-110'
              : 'bg-ink-100 text-ink-300 cursor-not-allowed'
          )}
        >
          💾 캐릭터 저장
        </button>
      </div>

      {saveChars.isError && <ErrorBox>{(saveChars.error as Error)?.message}</ErrorBox>}

      {/* 표지 */}
      <Section title="📕 표지 (글자 없음 — 클라가 제목 오버레이)">
        <CoverUploader
          existingUrl={slice?.coverImageUrl}
          onUpload={(file) => uploadCover.mutate(file)}
          pending={uploadCover.isPending}
          error={uploadCover.error as Error | null}
        />
      </Section>

      {/* 캐릭터 */}
      <Section title="👥 캐릭터 시트">
        {characters.length === 0 ? (
          <p className="text-xs text-ink-500 font-bold py-3">캐릭터 없음 — 추가해주세요</p>
        ) : (
          <div className="space-y-2">
            {characters.map((c, idx) => (
              <CharacterRow
                key={c.id}
                char={c}
                onChange={(patch) => updateChar(idx, patch)}
                onRemove={() => removeChar(idx)}
              />
            ))}
          </div>
        )}
        <button
          onClick={addCharacter}
          className="mt-3 px-3 py-1.5 rounded-md border border-dashed border-coral-300 text-xs text-coral-500 font-bold hover:bg-coral-50"
        >
          + 캐릭터 추가
        </button>
      </Section>

      {/* 핵심단어 이미지 */}
      {manifest.keyObjectIds.length > 0 && (
        <Section title="🔑 핵심단어 이미지">
          <ImageGrid
            ids={manifest.keyObjectIds}
            urls={slice?.keyObjectImages ?? {}}
            onUpload={(refId, file) => uploadKeyObj.mutate({ refId, file })}
            pending={uploadKeyObj.isPending}
          />
        </Section>
      )}

      {/* 학습 어휘 이미지 */}
      {manifest.vocabIds.length > 0 && (
        <Section title="📚 학습 어휘 이미지">
          <ImageGrid
            ids={manifest.vocabIds}
            urls={slice?.vocabImages ?? {}}
            onUpload={(refId, file) => uploadVocab.mutate({ refId, file })}
            pending={uploadVocab.isPending}
          />
        </Section>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function CoverUploader({
  existingUrl,
  onUpload,
  pending,
  error,
}: {
  existingUrl: string | undefined;
  onUpload: (file: File) => void;
  pending: boolean;
  error: Error | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3">
      <div
        className={cn(
          'aspect-video w-full max-w-md rounded-md overflow-hidden border-2 border-dashed border-ink-200 bg-peach-50 flex items-center justify-center cursor-pointer hover:bg-peach-100',
          pending && 'opacity-50 cursor-wait'
        )}
        onClick={() => !pending && inputRef.current?.click()}
      >
        {existingUrl ? (
          <img src={existingUrl} alt="cover" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <div className="text-4xl">🖼️</div>
            <p className="text-xs text-ink-500 font-bold mt-1">클릭하여 표지 업로드</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
      {pending && <p className="text-xs text-ink-500 font-bold">업로드 중...</p>}
      {error && <ErrorBox>{error.message}</ErrorBox>}
    </div>
  );
}

function CharacterRow({
  char,
  onChange,
  onRemove,
}: {
  char: BookCharacter;
  onChange: (patch: Partial<BookCharacter>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-ink-100 rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-ink-500">{char.id}</span>
        <button onClick={onRemove} className="text-[11px] text-danger font-bold hover:underline">
          삭제
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={char.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="이름"
          className="input-sm"
        />
        <input
          value={char.role}
          onChange={(e) => onChange({ role: e.target.value })}
          placeholder="역할"
          className="input-sm"
        />
      </div>
      <textarea
        rows={2}
        value={char.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="외형 설명"
        className="input-sm"
      />
      {char.referenceImage && (
        <img
          src={char.referenceImage}
          alt={char.name}
          className="w-24 h-24 object-cover rounded-md"
        />
      )}
      <style>{`
        .input-sm {
          width: 100%;
          padding: 0.375rem 0.5rem;
          background: white;
          border: 1px solid var(--ink-200, #e2e8f0);
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          color: var(--ink-900, #0f172a);
          font-family: inherit;
        }
        .input-sm:focus { outline: 2px solid var(--coral-400, #ff7e5f); outline-offset: -1px; }
      `}</style>
    </div>
  );
}

function ImageGrid({
  ids,
  urls,
  onUpload,
  pending,
}: {
  ids: string[];
  urls: Record<string, string>;
  onUpload: (refId: string, file: File) => void;
  pending: boolean;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {ids.map((id) => (
        <ImageSlot
          key={id}
          id={id}
          url={urls[id]}
          onUpload={(f) => onUpload(id, f)}
          pending={pending}
        />
      ))}
    </div>
  );
}

function ImageSlot({
  id,
  url,
  onUpload,
  pending,
}: {
  id: string;
  url: string | undefined;
  onUpload: (file: File) => void;
  pending: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1">
      <div
        className={cn(
          'aspect-square rounded-md overflow-hidden border border-dashed border-ink-200 bg-peach-50 flex items-center justify-center cursor-pointer hover:bg-peach-100',
          pending && 'opacity-50 cursor-wait'
        )}
        onClick={() => !pending && inputRef.current?.click()}
      >
        {url ? (
          <img src={url} alt={id} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl text-ink-300">+</span>
        )}
      </div>
      <p className="text-[10px] font-mono text-ink-500 truncate" title={id}>
        {id}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: import('react').ReactNode }) {
  return (
    <section className="bg-white rounded-md p-5 shadow-soft space-y-3">
      <h2 className="text-sm font-black text-ink-900 font-display">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Centered({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-md p-8 text-center shadow-soft">
      {children}
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
