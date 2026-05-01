import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVocabularyUnit, useUpsertVocabularyUnit } from '../hooks/useVocabularyUnits';
import type { VocabularyUnit, VocabularyUnitWord } from '@tangobook/shared';
import { Mascot, Skeleton } from '@/design-system';

/** 저작도구 어휘 단원 편집기 — 메타 + 단어 list (이미지/예문/TTS 자동 매핑은 vocabulary-db 와 통합됨) */
export function VocabularyUnitEditor() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const { data: unit, isLoading } = useVocabularyUnit(unitId);
  const upsert = useUpsertVocabularyUnit();

  const [draft, setDraft] = useState<VocabularyUnit | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (unit) {
      setDraft(unit);
      setDirty(false);
    }
  }, [unit]);

  const handleSave = async () => {
    if (!draft) return;
    await upsert.mutateAsync(draft);
    setDirty(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-10 w-1/2 rounded-lg" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="p-12 flex flex-col items-center gap-3 text-center">
        <Mascot state="thinking" size="lg" />
        <p className="text-lg font-bold text-ink-900">단원을 찾을 수 없어요</p>
        <button
          onClick={() => navigate('/editor2')}
          className="px-4 py-2 rounded-full bg-amber-500 text-white font-bold"
        >
          어휘 사이드바로
        </button>
      </div>
    );
  }

  const isCambridge = draft.source === 'cambridge-starters';

  const updateField = <K extends keyof VocabularyUnit>(key: K, value: VocabularyUnit[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setDirty(true);
  };

  const updateWord = (idx: number, partial: Partial<VocabularyUnitWord>) => {
    setDraft((d) => {
      if (!d) return d;
      const words = d.words.slice();
      words[idx] = { ...words[idx], ...partial };
      return { ...d, words };
    });
    setDirty(true);
  };

  const addWord = () => {
    setDraft((d) => (d ? { ...d, words: [...d.words, { word: '' }] } : d));
    setDirty(true);
  };

  const removeWord = (idx: number) => {
    setDraft((d) => (d ? { ...d, words: d.words.filter((_, i) => i !== idx) } : d));
    setDirty(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{draft.emoji ?? '✨'}</span>
          <div>
            <h1 className="text-2xl font-black font-display text-ink-900">
              {draft.nameKo}
              {isCambridge && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 align-middle">
                  Cambridge
                </span>
              )}
            </h1>
            <p className="text-sm text-ink-500">
              {draft.words.length}단어 · {draft.language === 'ko' ? '한국어' : '영어'}
              {draft.folder && ` · 📁 ${draft.folder}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-600 font-bold">변경됨</span>}
          <button
            onClick={handleSave}
            disabled={!dirty || upsert.isPending}
            className={`px-5 py-2 rounded-full font-black text-sm transition ${
              dirty
                ? 'bg-amber-500 text-white shadow-pop hover:brightness-110'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {upsert.isPending ? '저장 중…' : '💾 저장'}
          </button>
        </div>
      </header>

      {/* 메타 편집 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <h2 className="text-sm font-bold text-ink-700">단원 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs text-ink-500 font-bold">한글 이름</span>
            <input
              type="text"
              value={draft.nameKo}
              onChange={(e) => updateField('nameKo', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink-500 font-bold">English Name</span>
            <input
              type="text"
              value={draft.nameEn ?? ''}
              onChange={(e) => updateField('nameEn', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink-500 font-bold">이모지</span>
            <input
              type="text"
              value={draft.emoji ?? ''}
              onChange={(e) => updateField('emoji', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink-500 font-bold">언어</span>
            <select
              value={draft.language}
              onChange={(e) => updateField('language', e.target.value as 'ko' | 'en')}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="ko">한국어</option>
              <option value="en">영어</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-ink-500 font-bold">폴더</span>
            <input
              type="text"
              value={draft.folder ?? ''}
              onChange={(e) => updateField('folder', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </label>
          <label className="flex items-center gap-2 mt-5">
            <input
              type="checkbox"
              checked={!!draft.isPublic}
              onChange={(e) => updateField('isPublic', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-ink-700 font-bold">학습자 공개</span>
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-ink-500 font-bold">설명</span>
          <textarea
            value={draft.description ?? ''}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
            placeholder="이 단원을 설명하는 한 두 줄"
          />
        </label>
      </section>

      {/* 단어 list */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-ink-700">단어 ({draft.words.length})</h2>
          <button
            onClick={addWord}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
          >
            + 단어 추가
          </button>
        </div>
        <div className="space-y-2">
          {draft.words.length === 0 ? (
            <div className="text-center text-ink-500 text-sm py-6">
              단어가 없어요. 위 버튼으로 추가하세요.
            </div>
          ) : (
            draft.words.map((w, idx) => (
              <WordRow
                key={`${idx}-${w.word}`}
                word={w}
                onChange={(p) => updateWord(idx, p)}
                onRemove={() => removeWord(idx)}
                language={draft.language}
              />
            ))
          )}
        </div>

        {/* 안내 */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
          💡 <strong>이미지·예문·TTS 자동 매핑</strong>: 비어있는 필드는 학습자 화면에서
          vocabulary-db.json (동화/파닉스 자동 추출 풀)에서 자동 채움. 여기서는 손수 보강만 작성.
          향후 모듈 통합 예정.
        </div>
      </section>
    </div>
  );
}

interface WordRowProps {
  word: VocabularyUnitWord;
  language: 'ko' | 'en';
  onChange: (partial: Partial<VocabularyUnitWord>) => void;
  onRemove: () => void;
}

function WordRow({ word, language, onChange, onRemove }: WordRowProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={word.word}
          onChange={(e) => onChange({ word: e.target.value })}
          placeholder={language === 'ko' ? '단어 (한국어)' : '단어 (영어)'}
          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-md text-sm font-bold"
        />
        <input
          type="text"
          value={word.korean ?? ''}
          onChange={(e) => onChange({ korean: e.target.value })}
          placeholder="한국어 의미"
          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-md text-sm"
        />
        <button
          onClick={() => setExpanded((v) => !v)}
          className="px-2 py-1 text-xs font-bold rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300"
        >
          {expanded ? '▴' : '▾'}
        </button>
        <button
          onClick={onRemove}
          className="px-2 py-1 text-xs font-bold rounded-md text-red-500 hover:bg-red-50"
        >
          🗑
        </button>
      </div>
      {expanded && (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <label className="block">
            <span className="text-ink-500 font-bold">손수 이미지 URL (선택)</span>
            <input
              type="text"
              value={word.imageUrl ?? ''}
              onChange={(e) => onChange({ imageUrl: e.target.value })}
              placeholder="비우면 vocabulary-db 자동 매핑"
              className="w-full mt-0.5 px-2 py-1 border border-slate-200 rounded-md"
            />
          </label>
          <label className="block">
            <span className="text-ink-500 font-bold">손수 TTS URL (선택)</span>
            <input
              type="text"
              value={word.ttsUrl ?? ''}
              onChange={(e) => onChange({ ttsUrl: e.target.value })}
              placeholder="비우면 자동"
              className="w-full mt-0.5 px-2 py-1 border border-slate-200 rounded-md"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-ink-500 font-bold">예문 (한 줄에 하나, 선택)</span>
            <textarea
              value={(word.exampleSentences ?? []).join('\n')}
              onChange={(e) =>
                onChange({
                  exampleSentences: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              rows={2}
              placeholder="비우면 동화에서 자동 추출"
              className="w-full mt-0.5 px-2 py-1 border border-slate-200 rounded-md"
            />
          </label>
        </div>
      )}
    </div>
  );
}
