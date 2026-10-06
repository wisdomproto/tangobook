import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SUPPORTED_LANGUAGES,
  videoSubtitleError,
  type Storybook,
  type BookVideoFile,
  type BookVideoFormat,
  type BookVideoProduction,
  type BookVideoLanguage,
} from '@tangobook/shared';
import { useBookVideos, useSaveBookVideos, useRegisterBookVideos } from '../hooks/useBookVideos';
import { bookVideoApi } from '../api/book-video.api';
import { useUIStore } from '@/features/marketing/store/ui-store';
import { LocalCompositionPanel } from './LocalCompositionPanel';

const emptyTrack = (): BookVideoLanguage => ({ subtitleSrt: '', narrationText: '' });
const emptyProductions = (): Record<BookVideoFormat, BookVideoProduction> => ({
  long: { languages: {} },
  short: { languages: {} },
});
const action =
  'rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-violet-700';
const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white p-3 text-sm dark:bg-slate-800 dark:border-slate-600';

function UploadField({
  label,
  accept,
  file,
  disabled,
  onUpload,
}: {
  label: string;
  accept: string;
  file?: BookVideoFile;
  disabled: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold">
        {label}
        <input
          aria-label={label}
          type="file"
          accept={accept}
          disabled={disabled}
          className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-2 file:text-violet-700 disabled:opacity-50"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            e.target.value = '';
            if (selected) onUpload(selected);
          }}
        />
      </label>
      {file && (
        <a
          className="block break-all text-sm text-violet-600 underline"
          href={file.url}
          target="_blank"
          rel="noreferrer"
        >
          {file.name} · {(file.bytes / 1024 ** 2).toFixed(1)} MB
        </a>
      )}
    </div>
  );
}

export function BookVideoTab({ storybook }: { storybook: Storybook }) {
  const query = useBookVideos(storybook.id);
  const save = useSaveBookVideos(storybook.id);
  const register = useRegisterBookVideos(storybook.id);
  const [draft, setDraft] = useState<Record<BookVideoFormat, BookVideoProduction> | null>(null);
  const [baseRevision, setBaseRevision] = useState(0);
  const [format, setFormat] = useState<BookVideoFormat>('long');
  const [lang, setLang] = useState('ko');
  const [historyId, setHistoryId] = useState('');
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [subtitleUrl, setSubtitleUrl] = useState('');
  const versions = query.data?.versions ?? [];
  const latest = versions.at(-1);
  const history = versions.find((v) => v.id === historyId);
  const production = (history?.productions ?? draft ?? emptyProductions())[format];
  const track = production.languages[lang] ?? emptyTrack();
  const busy = uploading || composing || save.isPending || register.isPending;
  const readOnly = Boolean(history);
  const languageCodes = [
    ...new Set(['ko', 'en', ...(storybook.languages ?? []), ...Object.keys(production.languages)]),
  ];
  const video = track.video ?? production.original;
  useEffect(() => {
    if (query.data && !draft) {
      setDraft(structuredClone(query.data.versions.at(-1)?.productions ?? emptyProductions()));
      setBaseRevision(query.data.revision);
    }
  }, [query.data, draft]);
  useEffect(() => {
    if (!track.subtitleSrt.trim()) {
      setSubtitleUrl('');
      return;
    }
    const vtt =
      'WEBVTT\n\n' +
      track.subtitleSrt.replace(/^\uFEFF/, '').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    const url = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
    setSubtitleUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [track.subtitleSrt]);
  function update(mutator: (p: BookVideoProduction) => void) {
    setDraft((current) => {
      const next = structuredClone(current ?? emptyProductions());
      mutator(next[format]);
      return next;
    });
    setDirty(true);
    setError('');
    register.reset();
  }
  function updateTrack(patch: Partial<BookVideoLanguage>) {
    update((p) => {
      p.languages[lang] = { ...(p.languages[lang] ?? emptyTrack()), ...patch };
    });
  }
  async function upload(file: File, target: 'original' | 'video' | 'narration' | 'cover') {
    setUploading(true);
    setError('');
    try {
      const uploaded = await bookVideoApi.upload(storybook.id, file);
      if (target === 'original')
        update((p) => {
          p.original = uploaded;
        });
      else updateTrack({ [target]: uploaded });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  async function importSrt(file: File) {
    try {
      if (file.size > 200000) throw new Error('SRT 자막은 200KB 이하로 선택해 주세요.');
      updateTrack({ subtitleSrt: (await file.text()).replace(/^\uFEFF/, '') });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function saveDraft() {
    if (!draft) return;
    setError('');
    setConflict(false);
    for (const p of Object.values(draft))
      for (const t of Object.values(p.languages)) {
        const message = videoSubtitleError(t.subtitleSrt);
        if (message) {
          setError(message);
          return;
        }
      }
    try {
      const result = await save.mutateAsync({ revision: baseRevision, productions: draft });
      setDraft(structuredClone(result.versions.at(-1)!.productions));
      setBaseRevision(result.revision);
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
      setConflict((e as Error).message.includes('다른 창'));
    }
  }
  async function reloadAfterConflict() {
    const result = await query.refetch();
    if (!result.data || result.isError) return;
    setDraft(structuredClone(result.data.versions.at(-1)?.productions ?? emptyProductions()));
    setBaseRevision(result.data.revision);
    setDirty(false);
    setError('');
    setConflict(false);
    register.reset();
  }
  function downloadSrt() {
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + track.subtitleSrt], { type: 'application/x-subrip' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${storybook.id}-${format}-${lang}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  if (query.isPending) return <p className="p-8 text-slate-500">영상 자료를 불러오고 있습니다.</p>;
  if (query.isError)
    return (
      <div role="alert" className="p-6 text-red-600">
        {query.error.message}
        <button className={action + ' ml-3'} onClick={() => query.refetch()}>
          다시 불러오기
        </button>
      </div>
    );
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">영상</h2>
          <p className="mt-1 text-sm text-slate-500">
            롱폼·숏폼 원본과 영상용 언어 자료를 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={action} disabled={busy || !dirty || readOnly} onClick={saveDraft}>
            영상 자료 저장
          </button>
          <button
            className={action}
            disabled={
              busy ||
              dirty ||
              !latest ||
              readOnly ||
              !Object.values(latest.productions).some((p) =>
                Object.values(p.languages).some((t) => t.video)
              )
            }
            onClick={() => latest && register.mutate(latest.id)}
          >
            마케팅 콘텐츠로 등록
          </button>
        </div>
      </div>
      {(error || register.error) && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error || register.error?.message}
        </p>
      )}
      {conflict && (
        <button
          className="rounded-lg border px-4 py-2 text-sm"
          disabled={busy}
          onClick={reloadAfterConflict}
        >
          현재 변경을 버리고 최신 영상 자료 불러오기
        </button>
      )}
      {uploading && (
        <p role="status" className="text-sm text-violet-600">
          파일을 업로드하고 있습니다. 완료 후 영상 자료를 저장해 주세요.
        </p>
      )}
      {dirty && (
        <p className="text-sm text-amber-700">
          저장하지 않은 변경이 있습니다. 저장하면 새 버전으로 보관됩니다.
        </p>
      )}
      {register.data && (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {register.data.reused ? '이미 등록된 영상입니다.' : '마케팅 콘텐츠에 등록했습니다.'}{' '}
          <Link
            to="/marketing"
            className="ml-2 underline"
            onClick={() => {
              useUIStore.getState().setContentKindTab('regular');
              useUIStore.getState().setSelectedProjectId(register.data!.projectId);
              useUIStore.getState().setSelectedContentId(register.data!.contentId);
            }}
          >
            마케팅에서 보기
          </Link>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="영상 형식" className="flex gap-2">
          {(['long', 'short'] as const).map((f) => (
            <button
              key={f}
              className={format === f ? action : 'rounded-lg border px-4 py-2 text-sm'}
              disabled={busy}
              onClick={() => setFormat(f)}
            >
              {f === 'long' ? '롱폼 · 16:9' : '숏폼 · 9:16'}
            </button>
          ))}
        </div>
        <label className="ml-auto text-sm">
          버전{' '}
          <select
            aria-label="영상 버전"
            className="rounded-lg border p-2"
            disabled={busy || dirty}
            value={historyId}
            onChange={(e) => setHistoryId(e.target.value)}
          >
            <option value="">최신{latest ? ` · v${latest.number}` : ' · 새 제작'}</option>
            {versions
              .slice(0, -1)
              .reverse()
              .map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.number} · {new Date(v.createdAt).toLocaleString('ko-KR')}
                </option>
              ))}
          </select>
        </label>
      </div>
      {readOnly && (
        <p className="text-sm text-slate-500">
          이전 버전의 자료입니다. 새 자료는 최신 버전에서 저장해 주세요.
        </p>
      )}
      <div className="rounded-xl border bg-white p-5 dark:bg-slate-800">
        <UploadField
          label="공통 원본 영상"
          accept="video/mp4,video/webm"
          file={production.original}
          disabled={busy || readOnly}
          onUpload={(file) => upload(file, 'original')}
        />
        <p className="mt-2 text-xs text-slate-500">
          언어별 편집의 기준이 되는 원본입니다. 마케팅 등록에는 아래 언어별 완성 영상을 사용합니다.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="영상 언어">
        {languageCodes.map((code) => (
          <button
            key={code}
            disabled={busy}
            onClick={() => setLang(code)}
            className={lang === code ? action : 'rounded-lg border px-4 py-2 text-sm'}
          >
            {SUPPORTED_LANGUAGES.find((l) => l.code === code)?.label ?? code}
          </button>
        ))}
      </div>
      <LocalCompositionPanel
        key={`${format}:${lang}`}
        original={production.original}
        track={track}
        format={format}
        language={lang}
        bookId={storybook.id}
        disabled={busy || readOnly}
        onBusy={setComposing}
        onUse={(file) => upload(file, 'video')}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-xl border bg-white p-5 dark:bg-slate-800">
          <h3 className="font-bold">영상과 나레이션</h3>
          {video ? (
            <video
              key={video.url}
              src={video.url}
              poster={track.cover?.url}
              controls
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
              className={
                'mx-auto max-h-[480px] w-full rounded-lg bg-black ' +
                (format === 'short' ? 'aspect-[9/16]' : 'aspect-video')
              }
            >
              {subtitleUrl && (
                <track
                  key={subtitleUrl}
                  src={subtitleUrl}
                  kind="subtitles"
                  srcLang={lang}
                  label="영상 자막"
                />
              )}
            </video>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
              원본 또는 완성 영상을 업로드해 주세요.
            </div>
          )}
          <UploadField
            label="언어별 완성 영상"
            accept="video/mp4,video/webm"
            file={track.video}
            disabled={busy || readOnly}
            onUpload={(file) => upload(file, 'video')}
          />
          <UploadField
            label="언어별 썸네일"
            accept="image/png,image/jpeg,image/webp"
            file={track.cover}
            disabled={busy || readOnly}
            onUpload={(file) => upload(file, 'cover')}
          />
          <UploadField
            label="영상용 나레이션 음원"
            accept="audio/*"
            file={track.narration}
            disabled={busy || readOnly}
            onUpload={(file) => upload(file, 'narration')}
          />
          {track.narration && (
            <audio src={track.narration.url} controls preload="metadata" className="w-full" />
          )}
          <label className="block space-y-2 text-sm font-semibold">
            <span>영상용 나레이션 대본</span>
            <textarea
              className={inputClass}
              rows={7}
              value={track.narrationText}
              disabled={busy || readOnly}
              onChange={(e) => updateTrack({ narrationText: e.target.value })}
              placeholder="책 본문과 별도로 각색한 영상 대본"
            />
          </label>
        </div>
        <div className="space-y-4 rounded-xl border bg-white p-5 dark:bg-slate-800">
          <h3 className="font-bold">영상용 자막 · SRT</h3>
          <p className="text-sm text-slate-500">
            영상 시간에 맞춘 자막입니다. 책 본문이나 페이지 TTS에는 반영되지 않습니다. 미리보기
            플레이어의 자막 메뉴에서 켤 수 있습니다.
          </p>
          <label className="block text-sm">
            SRT 파일 가져오기
            <input
              aria-label="SRT 파일 가져오기"
              type="file"
              accept=".srt"
              disabled={busy || readOnly}
              className="mt-2 block text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void importSrt(f);
              }}
            />
          </label>
          <textarea
            aria-label="영상용 SRT 자막"
            className={inputClass + ' font-mono'}
            rows={22}
            value={track.subtitleSrt}
            disabled={busy || readOnly}
            onChange={(e) => updateTrack({ subtitleSrt: e.target.value })}
            placeholder={'1\n00:00:00,000 --> 00:00:02,000\n첫 사건을 보여 주세요.'}
          />
          <button
            className="rounded-lg border px-4 py-2 text-sm"
            disabled={!track.subtitleSrt.trim()}
            onClick={downloadSrt}
          >
            SRT 다운로드
          </button>
        </div>
      </div>
    </section>
  );
}
