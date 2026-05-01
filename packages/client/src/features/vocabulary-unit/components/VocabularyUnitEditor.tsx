import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVocabularyUnit, useUpsertVocabularyUnit } from '../hooks/useVocabularyUnits';
import { vocabularyUnitApi } from '../api/vocabulary-unit.api';
import { ttsApi } from '@/features/tts/api/tts.api';
import type {
  VocabularyUnit,
  VocabularyUnitWord,
  VocabularyWordImage,
  ImageGenerationResult,
} from '@tangobook/shared';
import { TTS_VOICES, DEFAULT_IMAGE_MODEL } from '@tangobook/shared';
import { Mascot, Skeleton, Button } from '@/design-system';
import { ImageLightbox } from '@/components/ImageLightbox';
import { ImageDropZone } from '@/components/ImageDropZone';
import { ImagePreview } from '@/components/ImagePreview';
import { DownloadButton } from '@/components/DownloadButton';
import { UploadMenu } from '@/components/UploadMenu';
import { BatchProgressBar } from '@/components/BatchProgressBar';
import { ImageModelSelector } from '@/components/ImageModelSelector';
import { apiClient } from '@/lib/axios';

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

  // 즉시 저장 헬퍼 — 이미지/TTS 생성 후 url 잃지 않게
  const saveNow = useCallback(
    async (next: VocabularyUnit) => {
      await upsert.mutateAsync(next);
      setDirty(false);
    },
    [upsert]
  );

  const handleSave = useCallback(async () => {
    if (!draft) return;
    await upsert.mutateAsync(draft);
    setDirty(false);
  }, [draft, upsert]);

  // ---- 단어 추가 form ----
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState({ word: '', korean: '', description: '' });

  // ---- TTS 일괄 ----
  const [ttsGeneratingIdx, setTtsGeneratingIdx] = useState<number | null>(null);
  const [ttsBatch, setTtsBatch] = useState<{ current: number; total: number } | null>(null);
  const [ttsVoice, setTtsVoice] = useState<string>(TTS_VOICES[0].id);
  const [ttsLang, setTtsLang] = useState<'ko' | 'en'>('ko');
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // ---- 이미지 일괄 ----
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [imageModel, setImageModel] = useState<string>(DEFAULT_IMAGE_MODEL);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ---- 이미지 / TTS 단일 ----
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);
  const [editingPrompt, setEditingPrompt] = useState('');

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
  const words = draft.words;

  const updateField = <K extends keyof VocabularyUnit>(key: K, value: VocabularyUnit[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setDirty(true);
  };

  const updateWord = (idx: number, partial: Partial<VocabularyUnitWord>) => {
    setDraft((d) => {
      if (!d) return d;
      const arr = d.words.slice();
      arr[idx] = { ...arr[idx], ...partial };
      return { ...d, words: arr };
    });
    setDirty(true);
  };

  const handleAddWord = () => {
    if (!newWord.word.trim()) return;
    setDraft((d) =>
      d
        ? {
            ...d,
            words: [
              ...d.words,
              {
                word: newWord.word.trim(),
                korean: newWord.korean.trim() || undefined,
                description: newWord.description.trim() || undefined,
              },
            ],
          }
        : d
    );
    setDirty(true);
    setNewWord({ word: '', korean: '', description: '' });
    setShowAddForm(false);
  };

  const handleDeleteWord = (idx: number) => {
    const w = words[idx];
    if (!w) return;
    if (!confirm(`"${w.word}" 단어를 삭제할까요? (이미지 ${w.images?.length ?? 0}장 포함)`)) return;
    setDraft((d) => (d ? { ...d, words: d.words.filter((_, i) => i !== idx) } : d));
    setDirty(true);
  };

  // === 단일 이미지 생성 ===
  const handleGenerateOne = async (idx: number) => {
    const w = words[idx];
    if (!w?.word.trim()) {
      alert('단어를 먼저 입력하세요!');
      return;
    }
    setGeneratingIdx(idx);
    try {
      const primary = (w.images ?? []).find((im) => im.isPrimary) ?? (w.images ?? [])[0];
      const result = await vocabularyUnitApi.generateImage({
        word: w.word,
        korean: w.korean,
        description: w.description,
        customPrompt: w.customPrompt,
        unitId: draft.id,
        artStyle: DEFAULT_ART_STYLE,
        currentImageUrl: primary?.imageUrl,
        model: imageModel,
      });
      const newImage: VocabularyWordImage = {
        id: `img-${Date.now()}`,
        imageUrl: result.imageUrl,
        prompt: w.customPrompt,
        isPrimary: !w.images?.length,
        createdAt: new Date().toISOString(),
      };
      const next: VocabularyUnit = {
        ...draft,
        words: draft.words.map((x, i) =>
          i === idx ? { ...x, images: [...(x.images ?? []), newImage] } : x
        ),
      };
      setDraft(next);
      await saveNow(next);
    } catch (e) {
      alert('이미지 생성 실패: ' + (e as Error).message);
    } finally {
      setGeneratingIdx(null);
    }
  };

  // === 전체 이미지 일괄 생성 (이미지 0장인 단어만 1장씩) ===
  const handleGenerateAll = async () => {
    const targets = words
      .map((w, idx) => ({ idx, w }))
      .filter(({ w }) => w.word.trim() && (w.images?.length ?? 0) === 0);
    if (targets.length === 0) {
      alert('이미지 없는 단어가 없어요!');
      return;
    }
    setGeneratingAll(true);
    const ac = new AbortController();
    abortControllerRef.current = ac;
    setBatchProgress({ current: 0, total: targets.length });

    let workingDraft = draft;
    let completed = 0;
    try {
      for (const { idx, w } of targets) {
        if (ac.signal.aborted) break;
        try {
          const result = await vocabularyUnitApi.generateImage(
            {
              word: w.word,
              korean: w.korean,
              description: w.description,
              customPrompt: w.customPrompt,
              unitId: draft.id,
              artStyle: DEFAULT_ART_STYLE,
              model: imageModel,
            },
            ac.signal
          );
          const newImage: VocabularyWordImage = {
            id: `img-${Date.now()}-${idx}`,
            imageUrl: result.imageUrl,
            prompt: w.customPrompt,
            isPrimary: true,
            createdAt: new Date().toISOString(),
          };
          workingDraft = {
            ...workingDraft,
            words: workingDraft.words.map((x, i) =>
              i === idx ? { ...x, images: [...(x.images ?? []), newImage] } : x
            ),
          };
          setDraft(workingDraft);
        } catch {
          // skip
        }
        completed++;
        setBatchProgress({ current: completed, total: targets.length });
      }
      await saveNow(workingDraft);
    } finally {
      abortControllerRef.current = null;
      setBatchProgress(null);
      setGeneratingAll(false);
    }
  };

  const handleCancelAll = () => {
    abortControllerRef.current?.abort();
  };

  // === 업로드 ===
  const handleUpload = async (idx: number, file: File) => {
    const w = words[idx];
    if (!w) return;
    setUploadingIdx(idx);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('storybookId', draft.id);
      form.append('storybookTitle', draft.nameKo);
      form.append('type', 'keyobj'); // 기존 image upload endpoint 재사용 (path 만 다름)
      form.append('characterName', w.word);
      const res = await apiClient.post<{ success: true; data: ImageGenerationResult }>(
        '/images/upload',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const url = res.data.data.imageUrl;
      const newImage: VocabularyWordImage = {
        id: `img-${Date.now()}`,
        imageUrl: url,
        isPrimary: !w.images?.length,
        createdAt: new Date().toISOString(),
      };
      const next: VocabularyUnit = {
        ...draft,
        words: draft.words.map((x, i) =>
          i === idx ? { ...x, images: [...(x.images ?? []), newImage] } : x
        ),
      };
      setDraft(next);
      await saveNow(next);
    } catch (e) {
      alert('업로드 실패: ' + (e as Error).message);
    } finally {
      setUploadingIdx(null);
    }
  };

  // === 이미지 삭제 / 대표 변경 ===
  const handleDeleteImage = async (idx: number, imageId: string) => {
    if (!confirm('이미지를 삭제할까요?')) return;
    const w = words[idx];
    if (!w) return;
    let imgs = (w.images ?? []).filter((im) => im.id !== imageId);
    if (imgs.length > 0 && !imgs.some((im) => im.isPrimary)) {
      imgs = imgs.map((im, i) => (i === 0 ? { ...im, isPrimary: true } : im));
    }
    const next: VocabularyUnit = {
      ...draft,
      words: draft.words.map((x, i) => (i === idx ? { ...x, images: imgs } : x)),
    };
    setDraft(next);
    await saveNow(next);
  };

  const handleSetPrimary = async (idx: number, imageId: string) => {
    const w = words[idx];
    if (!w) return;
    const imgs = (w.images ?? []).map((im) => ({ ...im, isPrimary: im.id === imageId }));
    const next: VocabularyUnit = {
      ...draft,
      words: draft.words.map((x, i) => (i === idx ? { ...x, images: imgs } : x)),
    };
    setDraft(next);
    await saveNow(next);
  };

  // === TTS ===
  const playTts = (url: string) => {
    if (ttsAudioRef.current) ttsAudioRef.current.pause();
    const audio = new Audio(url);
    ttsAudioRef.current = audio;
    audio.play().catch(() => {});
  };

  const generateOneTts = async (idx: number, lang: 'ko' | 'en') => {
    const w = words[idx];
    if (!w?.word.trim()) return;
    const text = lang === 'ko' ? w.korean || w.word : w.word;
    if (!text.trim()) return;
    setTtsGeneratingIdx(idx);
    try {
      const result = await ttsApi.generate({
        text,
        provider: 'gemini',
        voice: ttsVoice,
        language: lang,
        storybookId: draft.id,
        pageNumber: idx + 1,
      });
      const next: VocabularyUnit = {
        ...draft,
        words: draft.words.map((x, i) => {
          if (i !== idx) return x;
          if (lang === 'ko') return { ...x, ttsUrl: result.audioUrl };
          return { ...x, ttsUrls: { ...(x.ttsUrls ?? {}), [lang]: result.audioUrl } };
        }),
      };
      setDraft(next);
      await saveNow(next);
      playTts(result.audioUrl);
    } catch (e) {
      alert('TTS 생성 실패: ' + (e as Error).message);
    } finally {
      setTtsGeneratingIdx(null);
    }
  };

  const generateAllTts = async () => {
    const targets = words
      .map((w, idx) => ({ idx, text: ttsLang === 'ko' ? w.korean || w.word : w.word }))
      .filter((t) => t.text?.trim());
    if (targets.length === 0) return;
    if (!confirm(`${targets.length}개 단어의 ${ttsLang} TTS를 일괄 생성합니다. 계속할까요?`))
      return;
    setTtsBatch({ current: 0, total: targets.length });
    let workingDraft = draft;
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      setTtsBatch({ current: i + 1, total: targets.length });
      try {
        const result = await ttsApi.generate({
          text: t.text,
          provider: 'gemini',
          voice: ttsVoice,
          language: ttsLang,
          storybookId: draft.id,
          pageNumber: t.idx + 1,
        });
        workingDraft = {
          ...workingDraft,
          words: workingDraft.words.map((x, j) => {
            if (j !== t.idx) return x;
            if (ttsLang === 'ko') return { ...x, ttsUrl: result.audioUrl };
            return { ...x, ttsUrls: { ...(x.ttsUrls ?? {}), [ttsLang]: result.audioUrl } };
          }),
        };
        setDraft(workingDraft);
      } catch {
        // skip
      }
    }
    await saveNow(workingDraft);
    setTtsBatch(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* 단원 헤더 (sticky) */}
      <header className="flex items-center justify-between sticky top-14 bg-cream-50/95 backdrop-blur-sm py-2 z-20 -mx-6 px-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{draft.emoji ?? '✨'}</span>
          <div>
            <h1 className="text-xl font-black font-display text-ink-900">
              {draft.nameKo}
              {isCambridge && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 align-middle">
                  Cambridge
                </span>
              )}
            </h1>
            <p className="text-xs text-ink-500">
              {words.length}단어 · {draft.language === 'ko' ? '한국어' : '영어'}
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

      {/* 메타 — accordion */}
      <details className="bg-white rounded-2xl border border-slate-200 p-3 group">
        <summary className="cursor-pointer text-sm font-bold text-ink-700 select-none">
          단원 정보 (펼치기)
        </summary>
        <UnitMetaSection draft={draft} updateField={updateField} />
      </details>

      {/* 일괄 작업 영역 */}
      <section className="bg-white rounded-2xl border border-slate-200 p-3 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-ink-700 flex items-center gap-2">
            단어 ({words.length})
          </h2>
          <div className="flex gap-2 flex-wrap items-center">
            {/* 이미지 모델 */}
            <ImageModelSelector value={imageModel} onChange={setImageModel} label="모델" />
            {/* TTS 일괄 */}
            <select
              value={ttsLang}
              onChange={(e) => setTtsLang(e.target.value as 'ko' | 'en')}
              className="text-xs px-2 py-1 border border-slate-200 rounded-md"
            >
              <option value="ko">ko</option>
              <option value="en">en</option>
            </select>
            <select
              value={ttsVoice}
              onChange={(e) => setTtsVoice(e.target.value)}
              className="text-xs px-2 py-1 border border-slate-200 rounded-md"
            >
              {TTS_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              onClick={generateAllTts}
              disabled={!!ttsBatch || ttsGeneratingIdx !== null || words.length === 0}
              loading={!!ttsBatch}
            >
              {ttsBatch
                ? `🎙 TTS (${ttsBatch.current}/${ttsBatch.total})`
                : `🎙 TTS 일괄 (${ttsLang})`}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowAddForm(!showAddForm)}>
              + 단어 추가
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateAll}
              disabled={generatingAll || generatingIdx !== null || words.length === 0}
              loading={generatingAll}
            >
              🎨 전체 이미지 생성
            </Button>
          </div>
        </div>

        {batchProgress && (
          <BatchProgressBar
            current={batchProgress.current}
            total={batchProgress.total}
            label="이미지 일괄 생성"
            onCancel={handleCancelAll}
          />
        )}

        {/* 단어 추가 form */}
        {showAddForm && (
          <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-200 p-4 space-y-3">
            <h3 className="text-sm font-bold text-amber-800">새 단어 추가</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={newWord.word}
                onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                placeholder={draft.language === 'ko' ? '단어 (한국어)' : '단어 (영어)'}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <input
                value={newWord.korean}
                onChange={(e) => setNewWord({ ...newWord, korean: e.target.value })}
                placeholder="한국어 의미 (선택)"
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <textarea
              value={newWord.description}
              onChange={(e) => setNewWord({ ...newWord, description: e.target.value })}
              placeholder="단어 설명 (이미지 생성 시 사용)"
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => setShowAddForm(false)}>
                취소
              </Button>
              <Button size="sm" onClick={handleAddWord} disabled={!newWord.word.trim()}>
                추가
              </Button>
            </div>
          </div>
        )}

        {/* 단어 카드 그리드 — KeyObjectTab 와 동일한 4-col grid */}
        {words.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            단어가 없어요. 위 + 단어 추가 버튼을 눌러주세요.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {words.map((w, idx) => (
              <WordCard
                key={`${idx}-${w.word}`}
                word={w}
                idx={idx}
                generatingIdx={generatingIdx}
                generatingAll={generatingAll}
                uploadingIdx={uploadingIdx}
                ttsGeneratingIdx={ttsGeneratingIdx}
                expandedPrompt={expandedPrompt}
                editingPrompt={editingPrompt}
                ttsLang={ttsLang}
                onChange={(p) => updateWord(idx, p)}
                onDelete={() => handleDeleteWord(idx)}
                onGenerate={() => handleGenerateOne(idx)}
                onUpload={(file) => handleUpload(idx, file)}
                onLightbox={setLightboxUrl}
                onDeleteImage={(imageId) => handleDeleteImage(idx, imageId)}
                onSetPrimary={(imageId) => handleSetPrimary(idx, imageId)}
                onPlayTts={playTts}
                onGenerateTts={(lang) => generateOneTts(idx, lang)}
                onTogglePrompt={() => {
                  const next = expandedPrompt === idx ? null : idx;
                  if (next !== null) setEditingPrompt(w.customPrompt ?? '');
                  setExpandedPrompt(next);
                }}
                onPromptChange={setEditingPrompt}
                onPromptSave={() =>
                  updateWord(idx, { customPrompt: editingPrompt.trim() || undefined })
                }
              />
            ))}
          </div>
        )}
      </section>

      {lightboxUrl && (
        <ImageLightbox src={lightboxUrl} alt="단어" onClose={() => setLightboxUrl(null)} />
      )}
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
    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
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
      <label className="block md:col-span-3">
        <span className="text-xs text-ink-500 font-bold">설명</span>
        <textarea
          value={draft.description ?? ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={2}
          className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
        />
      </label>
    </div>
  );
}

interface WordCardProps {
  word: VocabularyUnitWord;
  idx: number;
  generatingIdx: number | null;
  generatingAll: boolean;
  uploadingIdx: number | null;
  ttsGeneratingIdx: number | null;
  expandedPrompt: number | null;
  editingPrompt: string;
  ttsLang: 'ko' | 'en';
  onChange: (partial: Partial<VocabularyUnitWord>) => void;
  onDelete: () => void;
  onGenerate: () => void;
  onUpload: (file: File) => void;
  onLightbox: (url: string) => void;
  onDeleteImage: (imageId: string) => void;
  onSetPrimary: (imageId: string) => void;
  onPlayTts: (url: string) => void;
  onGenerateTts: (lang: 'ko' | 'en') => void;
  onTogglePrompt: () => void;
  onPromptChange: (value: string) => void;
  onPromptSave: () => void;
}

function WordCard(props: WordCardProps) {
  const {
    word: w,
    idx,
    generatingIdx,
    generatingAll,
    uploadingIdx,
    ttsGeneratingIdx,
    expandedPrompt,
    editingPrompt,
    ttsLang,
    onChange,
    onDelete,
    onGenerate,
    onUpload,
    onLightbox,
    onDeleteImage,
    onSetPrimary,
    onPlayTts,
    onGenerateTts,
    onTogglePrompt,
    onPromptChange,
    onPromptSave,
  } = props;

  const images = w.images ?? [];
  const primary = images.find((im) => im.isPrimary) ?? images[0];
  const ttsUrl = ttsLang === 'ko' ? w.ttsUrl : w.ttsUrls?.[ttsLang];
  const ttsBusy = ttsGeneratingIdx === idx;
  const imgBusy = generatingIdx === idx || uploadingIdx === idx;

  return (
    <ImageDropZone onFile={onUpload} disabled={imgBusy} enablePaste={false}>
      {(openFilePicker) => (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center relative group">
          {/* Delete word */}
          <button
            onClick={onDelete}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
            title="단어 삭제"
          >
            ✕
          </button>

          {/* 대표 이미지 */}
          <ImagePreview
            src={primary?.imageUrl}
            alt={w.word}
            className="mb-2"
            onClick={() => primary?.imageUrl && onLightbox(primary.imageUrl)}
            onDelete={primary ? () => onDeleteImage(primary.id) : undefined}
          />

          {/* 추가 이미지 row — primary 외 N장 (작은 thumbnail) */}
          {images.length > 1 && (
            <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
              {images
                .filter((im) => im.id !== primary?.id)
                .map((im) => (
                  <button
                    key={im.id}
                    onClick={() => onSetPrimary(im.id)}
                    className="relative shrink-0 w-12 h-12 rounded border border-slate-200 overflow-hidden hover:ring-2 ring-amber-400 transition"
                    title="대표로 설정"
                  >
                    <img
                      src={im.imageUrl}
                      alt=""
                      aria-hidden
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
            </div>
          )}

          {/* 단어 / 한국어 인라인 편집 */}
          <input
            type="text"
            value={w.word}
            onChange={(e) => onChange({ word: e.target.value })}
            placeholder="단어"
            className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:outline-none focus:border-amber-500 px-0.5 py-0.5"
          />
          <input
            type="text"
            value={w.korean ?? ''}
            onChange={(e) => onChange({ korean: e.target.value })}
            placeholder="한국어"
            className="w-full text-xs text-slate-500 bg-transparent border-b border-slate-200 focus:outline-none focus:border-amber-500 px-0.5 py-0.5 mt-1"
          />

          {/* TTS */}
          <div className="mt-1 flex items-center justify-center gap-1">
            {ttsUrl ? (
              <>
                <button
                  onClick={() => onPlayTts(ttsUrl)}
                  disabled={ttsBusy}
                  className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  ▶ {ttsLang}
                </button>
                <button
                  onClick={() => onGenerateTts(ttsLang)}
                  disabled={ttsBusy}
                  className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 rounded"
                >
                  {ttsBusy ? '⟳' : '🔄'}
                </button>
              </>
            ) : (
              <button
                onClick={() => onGenerateTts(ttsLang)}
                disabled={ttsBusy}
                className="px-1.5 py-0.5 text-[10px] font-bold text-amber-600 hover:bg-amber-50 rounded disabled:opacity-50"
              >
                {ttsBusy ? '⟳ 생성' : `🎙 ${ttsLang} TTS`}
              </button>
            )}
          </div>

          {/* description / 페이지 정보 */}
          {w.description && (
            <p className="text-[11px] text-slate-400 mt-1 text-left leading-relaxed line-clamp-2">
              {w.description}
            </p>
          )}
          {(images.length ?? 0) > 0 && (
            <p className="text-[10px] text-amber-500 font-bold mt-1">🖼 이미지 {images.length}장</p>
          )}

          {/* prompt accordion */}
          <button
            onClick={onTogglePrompt}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium mt-1 flex items-center justify-center gap-0.5 w-full"
          >
            프롬프트
            <span
              className={`text-[10px] transition-transform ${expandedPrompt === idx ? 'rotate-180' : ''}`}
            >
              ▾
            </span>
          </button>
          {expandedPrompt === idx && (
            <textarea
              value={editingPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onBlur={onPromptSave}
              rows={3}
              className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none text-xs text-slate-600 text-left"
              placeholder="이미지 생성 시 참조할 프롬프트…"
            />
          )}

          {/* 액션 — 생성 + 다운로드 + 업로드 */}
          <div className="flex gap-1 mt-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={onGenerate}
              loading={imgBusy}
              disabled={generatingIdx !== null || generatingAll || uploadingIdx !== null}
            >
              {primary?.imageUrl ? '+ 추가' : '생성'}
            </Button>
            {primary?.imageUrl && (
              <DownloadButton href={primary.imageUrl} filename={`${w.korean || w.word}.png`} />
            )}
            <UploadMenu onFile={onUpload} openFilePicker={openFilePicker} disabled={imgBusy} />
          </div>
        </div>
      )}
    </ImageDropZone>
  );
}
