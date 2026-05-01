import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVocabularyUnit, useUpsertVocabularyUnit } from '../hooks/useVocabularyUnits';
import { vocabularyUnitApi } from '../api/vocabulary-unit.api';
import { ttsApi } from '@/features/tts/api/tts.api';
import type { VocabularyUnit, VocabularyUnitWord, VocabularyWordImage } from '@tangobook/shared';
import { TTS_VOICES } from '@tangobook/shared';
import { Mascot, Skeleton } from '@/design-system';
import { ImageLightbox } from '@/components/ImageLightbox';

const DEFAULT_ART_STYLE = 'photographic-realistic';

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

  const handleSave = useCallback(async () => {
    if (!draft) return;
    await upsert.mutateAsync(draft);
    setDirty(false);
  }, [draft, upsert]);

  const saveDraftNow = useCallback(
    async (next: VocabularyUnit) => {
      await upsert.mutateAsync(next);
      setDirty(false);
    },
    [upsert]
  );

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
      <header className="flex items-center justify-between sticky top-14 bg-cream-50/95 backdrop-blur-sm py-2 z-10 -mx-6 px-6">
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

      <UnitMetaSection draft={draft} updateField={updateField} />

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
        <div className="space-y-3">
          {draft.words.length === 0 ? (
            <div className="text-center text-ink-500 text-sm py-6">
              단어가 없어요. 위 버튼으로 추가하세요.
            </div>
          ) : (
            draft.words.map((w, idx) => (
              <WordCard
                key={`${idx}-${w.word}`}
                word={w}
                idx={idx}
                unitId={draft.id}
                language={draft.language}
                onChange={(p) => updateWord(idx, p)}
                onRemove={() => removeWord(idx)}
                onAfterImageGen={async (next) => {
                  if (!draft) return;
                  const draftCopy: VocabularyUnit = {
                    ...draft,
                    words: draft.words.map((x, i) => (i === idx ? next : x)),
                  };
                  setDraft(draftCopy);
                  await saveDraftNow(draftCopy);
                }}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function UnitMetaSection({
  draft,
  updateField,
}: {
  draft: VocabularyUnit;
  updateField: <K extends keyof VocabularyUnit>(key: K, value: VocabularyUnit[K]) => void;
}) {
  return (
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
  );
}

interface WordCardProps {
  word: VocabularyUnitWord;
  idx: number;
  unitId: string;
  language: 'ko' | 'en';
  onChange: (partial: Partial<VocabularyUnitWord>) => void;
  onRemove: () => void;
  onAfterImageGen: (next: VocabularyUnitWord) => Promise<void>;
}

function WordCard({
  word,
  idx,
  unitId,
  language,
  onChange,
  onRemove,
  onAfterImageGen,
}: WordCardProps) {
  const [generating, setGenerating] = useState(false);
  const [genTtsLang, setGenTtsLang] = useState<'ko' | 'en' | null>(null);
  const [ttsVoice, setTtsVoice] = useState<string>(TTS_VOICES[0].id);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const images = word.images ?? [];
  const primary = images.find((im) => im.isPrimary) ?? images[0];

  const handleGenerateImage = async () => {
    if (!word.word.trim()) {
      alert('단어를 먼저 입력하세요!');
      return;
    }
    setGenerating(true);
    try {
      const result = await vocabularyUnitApi.generateImage({
        word: word.word,
        korean: word.korean,
        description: word.description,
        customPrompt: word.customPrompt,
        unitId,
        artStyle: DEFAULT_ART_STYLE,
        currentImageUrl: primary?.imageUrl,
      });
      const newImage: VocabularyWordImage = {
        id: `img-${Date.now()}`,
        imageUrl: result.imageUrl,
        prompt: word.customPrompt,
        isPrimary: images.length === 0,
        createdAt: new Date().toISOString(),
      };
      const next: VocabularyUnitWord = {
        ...word,
        images: [...images, newImage],
      };
      await onAfterImageGen(next);
    } catch (e) {
      alert('이미지 생성 실패: ' + (e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('이미지를 삭제할까요?')) return;
    const newImages = images.filter((im) => im.id !== imageId);
    if (newImages.length > 0 && !newImages.some((im) => im.isPrimary)) {
      newImages[0] = { ...newImages[0], isPrimary: true };
    }
    const next: VocabularyUnitWord = { ...word, images: newImages };
    await onAfterImageGen(next);
  };

  const handleSetPrimary = async (imageId: string) => {
    const newImages = images.map((im) => ({ ...im, isPrimary: im.id === imageId }));
    const next: VocabularyUnitWord = { ...word, images: newImages };
    await onAfterImageGen(next);
  };

  const handleGenerateTts = async (lang: 'ko' | 'en') => {
    if (!word.word.trim()) {
      alert('단어를 먼저 입력하세요!');
      return;
    }
    const text = lang === 'ko' ? word.korean || word.word : word.word;
    if (!text.trim()) {
      alert(`${lang} 텍스트가 비어있어요!`);
      return;
    }
    setGenTtsLang(lang);
    try {
      const result = await ttsApi.generate({
        text,
        provider: 'gemini',
        voice: ttsVoice,
        language: lang,
        storybookId: unitId,
        pageNumber: idx + 1,
      });
      const next: VocabularyUnitWord = { ...word };
      if (lang === 'ko') {
        next.ttsUrl = result.audioUrl;
      } else {
        next.ttsUrls = { ...(word.ttsUrls ?? {}), [lang]: result.audioUrl };
      }
      await onAfterImageGen(next);
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(result.audioUrl);
      audioRef.current = audio;
      audio.play().catch(() => {});
    } catch (e) {
      alert('TTS 생성 실패: ' + (e as Error).message);
    } finally {
      setGenTtsLang(null);
    }
  };

  const playTts = (url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const enTts = word.ttsUrls?.en;

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
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
          onClick={onRemove}
          className="px-2 py-1 text-xs font-bold rounded-md text-red-500 hover:bg-red-50"
          title="단어 삭제"
        >
          🗑
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <div className="text-xs font-bold text-ink-500 mb-1">
            이미지 ({images.length})
            {primary && <span className="ml-2 text-amber-600">★ 대표 표시</span>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {images.map((im) => (
              <ImageThumbnail
                key={im.id}
                image={im}
                onSetPrimary={() => handleSetPrimary(im.id)}
                onDelete={() => handleDeleteImage(im.id)}
                onLightbox={() => setLightboxUrl(im.imageUrl)}
              />
            ))}
            <button
              onClick={handleGenerateImage}
              disabled={generating}
              className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-xs font-bold transition ${
                generating
                  ? 'border-slate-300 bg-slate-100 text-slate-400'
                  : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {generating ? (
                <>
                  <span className="animate-spin">⟳</span>
                  <span>생성중…</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">🎨</span>
                  <span>+ 자동</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <label className="block">
            <span className="text-ink-500 font-bold">설명 (이미지 prompt)</span>
            <textarea
              value={word.description ?? ''}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={2}
              placeholder="단어 설명 — 이미지 생성에 사용"
              className="w-full mt-0.5 px-2 py-1 border border-slate-200 rounded-md"
            />
          </label>
          <details>
            <summary className="cursor-pointer text-ink-500 font-bold">고급 prompt</summary>
            <textarea
              value={word.customPrompt ?? ''}
              onChange={(e) => onChange({ customPrompt: e.target.value })}
              rows={2}
              placeholder="prompt override (선택)"
              className="w-full mt-0.5 px-2 py-1 border border-slate-200 rounded-md"
            />
          </details>

          <label className="block">
            <span className="text-ink-500 font-bold">정의 / 예문</span>
            <input
              type="text"
              value={word.definition ?? ''}
              onChange={(e) => onChange({ definition: e.target.value })}
              placeholder="짧은 정의"
              className="w-full mt-0.5 px-2 py-1 border border-slate-200 rounded-md"
            />
            <input
              type="text"
              value={word.example ?? ''}
              onChange={(e) => onChange({ example: e.target.value })}
              placeholder="예문 (선택)"
              className="w-full mt-0.5 px-2 py-1 border border-slate-200 rounded-md"
            />
          </label>

          <div className="border-t border-slate-200 pt-2 space-y-1">
            <div className="flex items-center justify-between text-ink-500 font-bold">
              <span>TTS</span>
              <select
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
                className="text-[10px] px-1 py-0.5 border border-slate-200 rounded"
              >
                {TTS_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-ink-500 w-6">ko</span>
              {word.ttsUrl && (
                <button
                  onClick={() => playTts(word.ttsUrl!)}
                  className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded"
                >
                  ▶
                </button>
              )}
              <button
                onClick={() => handleGenerateTts('ko')}
                disabled={genTtsLang !== null}
                className="flex-1 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded font-bold hover:bg-amber-200 disabled:opacity-50"
              >
                {genTtsLang === 'ko' ? '…' : word.ttsUrl ? '재생성' : '🔊 생성'}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-ink-500 w-6">en</span>
              {enTts && (
                <button
                  onClick={() => playTts(enTts)}
                  className="px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded"
                >
                  ▶
                </button>
              )}
              <button
                onClick={() => handleGenerateTts('en')}
                disabled={genTtsLang !== null}
                className="flex-1 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded font-bold hover:bg-amber-200 disabled:opacity-50"
              >
                {genTtsLang === 'en' ? '…' : enTts ? '재생성' : '🔊 생성'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {lightboxUrl && <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}

function ImageThumbnail({
  image,
  onSetPrimary,
  onDelete,
  onLightbox,
}: {
  image: VocabularyWordImage;
  onSetPrimary: () => void;
  onDelete: () => void;
  onLightbox: () => void;
}) {
  return (
    <div
      className={`relative aspect-square rounded-lg overflow-hidden border-2 group cursor-pointer ${
        image.isPrimary ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200'
      }`}
    >
      <img
        src={image.imageUrl}
        alt=""
        aria-hidden
        className="w-full h-full object-cover"
        onClick={onLightbox}
      />
      {image.isPrimary && (
        <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-amber-500 text-white text-[10px] font-black">
          ★
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-1 flex gap-1 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/70 to-transparent transition">
        {!image.isPrimary && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetPrimary();
            }}
            className="flex-1 px-1 py-0.5 text-[10px] font-bold bg-white/90 text-amber-600 rounded"
            title="대표로 설정"
          >
            ★ 대표
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="px-1.5 py-0.5 text-[10px] font-bold bg-white/90 text-red-500 rounded"
          title="삭제"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
