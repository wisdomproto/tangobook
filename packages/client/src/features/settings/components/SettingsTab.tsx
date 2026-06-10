import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ART_STYLES } from '@tangobook/shared';
import type { Storybook } from '@tangobook/shared';
import { settingsApi } from '../api/settings.api';
import type { BgmItem } from '../api/settings.api';
import { PhonicsAudioLibrary } from './PhonicsAudioLibrary';
import { SystemSoundsLibrary } from './SystemSoundsLibrary';
import { ArtStyleLibraryModal } from './ArtStyleLibraryModal';

interface SettingsTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function SettingsTab({ storybook, onUpdate, onSave }: SettingsTabProps) {
  // Art style state
  const [useCustom, setUseCustom] = useState(
    () => !ART_STYLES.some((s) => s.prompt === storybook.artStyle)
  );
  const [customStyle, setCustomStyle] = useState(storybook.artStyle);
  const [extractedStyle, setExtractedStyle] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // BGM state
  const [bgmUrl, setBgmUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmFileRef = useRef<HTMLInputElement>(null);
  const [bgmLibrary, setBgmLibrary] = useState<BgmItem[]>([]);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [bgmVolume, setBgmVolume] = useState(storybook.backgroundMusicVolume ?? 30);

  useEffect(() => {
    settingsApi
      .getBgmList()
      .then(setBgmLibrary)
      .catch(() => {});
  }, []);

  // 외부에서 볼륨이 바뀌면(다른 곳에서 저장 등) 슬라이더 동기화
  useEffect(() => {
    setBgmVolume(storybook.backgroundMusicVolume ?? 30);
  }, [storybook.backgroundMusicVolume]);

  // Art style library
  const [showStyleLibrary, setShowStyleLibrary] = useState(false);
  const [savingStyle, setSavingStyle] = useState(false);

  const handleSaveToStyleLibrary = async (prompt: string) => {
    const name = window.prompt('저장할 그림체 이름을 입력하세요:');
    if (!name?.trim()) return;
    setSavingStyle(true);
    try {
      await settingsApi.saveArtStyle({ name: name.trim(), prompt });
    } catch {
      /* silent */
    } finally {
      setSavingStyle(false);
    }
  };

  const handleApplyFromLibrary = (prompt: string) => {
    setCustomStyle(prompt);
    setUseCustom(true);
    onUpdate((d) => {
      d.artStyle = prompt;
    });
    onSave();
    setShowStyleLibrary(false);
  };

  // --- Art Style ---
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setUseCustom(true);
      return;
    }
    setUseCustom(false);
    const prompt = ART_STYLES.find((s) => s.id === val)?.prompt ?? val;
    onUpdate((d) => {
      d.artStyle = prompt;
    });
    onSave();
  };

  const handleCustomApply = () => {
    if (!customStyle.trim()) return;
    onUpdate((d) => {
      d.artStyle = customStyle.trim();
    });
    onSave();
  };

  const handleAnalyzeFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setAnalyzing(true);
    setExtractedStyle(null);
    try {
      const { prompt } = await settingsApi.analyzeArtStyle(file);
      setExtractedStyle(prompt);
    } catch {
      setExtractedStyle('스타일 분석에 실패했습니다.');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleAnalyzeFile(file);
    },
    [handleAnalyzeFile]
  );

  const handleApplyExtracted = () => {
    if (!extractedStyle) return;
    setCustomStyle(extractedStyle);
    setUseCustom(true);
    onUpdate((d) => {
      d.artStyle = extractedStyle;
    });
    onSave();
  };

  // --- BGM ---
  const handleBgmUrlApply = () => {
    if (!bgmUrl.trim()) return;
    onUpdate((d) => {
      d.backgroundMusicUrl = bgmUrl.trim();
    });
    onSave();
    setBgmUrl('');
  };

  const handleBgmUpload = async (file: File) => {
    setUploading(true);
    try {
      const { audioUrl } = await settingsApi.uploadBgm(file, storybook.id, storybook.title);
      onUpdate((d) => {
        d.backgroundMusicUrl = audioUrl;
      });
      onSave();
      // Refresh BGM library to show the newly added item
      settingsApi
        .getBgmList()
        .then(setBgmLibrary)
        .catch(() => {});
    } catch {
      // handled silently
    } finally {
      setUploading(false);
    }
  };

  const handleBgmDelete = () => {
    onUpdate((d) => {
      d.backgroundMusicUrl = undefined;
    });
    onSave();
    if (audioRef.current) {
      audioRef.current.pause();
      setBgmPlaying(false);
    }
  };

  const handleBgmLibraryDelete = async (item: BgmItem) => {
    if (!confirm(`"${item.title}" 배경음악을 라이브러리에서 삭제할까요?`)) return;
    try {
      await settingsApi.deleteBgm(item.id);
      setBgmLibrary((prev) => prev.filter((b) => b.id !== item.id));
      // If the deleted BGM is currently selected, clear it
      if (storybook.backgroundMusicUrl === item.url) {
        handleBgmDelete();
      }
      // Stop preview if playing
      if (previewingId === item.id) {
        previewAudioRef.current?.pause();
        setPreviewingId(null);
      }
    } catch {
      // handled silently
    }
  };

  // --- BGM 볼륨 (뷰어 배경음악 기본 볼륨) ---
  const applyBgmVolumeLive = (v: number) => {
    if (audioRef.current) audioRef.current.volume = v / 100;
    if (previewAudioRef.current) previewAudioRef.current.volume = v / 100;
  };
  const handleBgmVolumeChange = (v: number) => {
    setBgmVolume(v);
    applyBgmVolumeLive(v); // 드래그 중 미리듣기에 즉시 반영
  };
  const commitBgmVolume = () => {
    onUpdate((d) => {
      d.backgroundMusicVolume = bgmVolume;
    });
    onSave(); // 슬라이더 놓을 때만 저장 (드래그 중 매 스텝 저장 방지)
  };

  const toggleBgmPlay = () => {
    if (!storybook.backgroundMusicUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(storybook.backgroundMusicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = bgmVolume / 100;
      audioRef.current.addEventListener('ended', () => setBgmPlaying(false));
    }
    if (bgmPlaying) {
      audioRef.current.pause();
      setBgmPlaying(false);
    } else {
      audioRef.current.src = storybook.backgroundMusicUrl;
      audioRef.current.play().catch(() => {});
      setBgmPlaying(true);
    }
  };

  const handleBgmLibrarySelect = (item: BgmItem) => {
    onUpdate((d) => {
      d.backgroundMusicUrl = item.url;
    });
    onSave();
    stopPreview();
  };

  const togglePreview = (item: BgmItem) => {
    if (previewingId === item.id) {
      stopPreview();
      return;
    }
    stopPreview();
    const audio = new Audio(item.url);
    audio.loop = true;
    audio.volume = bgmVolume / 100;
    audio.play().catch(() => {});
    previewAudioRef.current = audio;
    setPreviewingId(item.id);
  };

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewingId(null);
  };

  const isPhonics = storybook.type === 'phonics';

  const currentPresetId =
    ART_STYLES.find((s) => s.prompt === storybook.artStyle)?.id ?? '__custom__';
  const labelClass = 'text-sm font-semibold text-slate-700 dark:text-slate-200';
  const selectClass =
    'text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100';

  return (
    <div className="space-y-8 max-w-2xl">
      {/* 그림체 섹션 */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">그림체</h3>

        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">현재 그림체</p>
          <p className="text-sm text-violet-600 font-medium bg-violet-50 dark:bg-violet-900/30 px-3 py-2 rounded-lg">
            {storybook.artStyle}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleSaveToStyleLibrary(storybook.artStyle)}
              disabled={savingStyle}
              className="px-3 py-1.5 text-xs font-medium border border-violet-200 dark:border-violet-700 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors disabled:opacity-50"
            >
              {savingStyle ? '저장 중...' : '라이브러리에 저장'}
            </button>
            <button
              onClick={() => setShowStyleLibrary(true)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              라이브러리
            </button>
          </div>
        </div>

        {/* 프리셋 or 커스텀 */}
        <div className="space-y-3">
          <label className={labelClass}>프리셋 선택</label>
          <select
            value={useCustom ? '__custom__' : currentPresetId}
            onChange={handlePresetChange}
            className={`${selectClass} w-full`}
          >
            {ART_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.prompt})
              </option>
            ))}
            <option value="__custom__">직접 입력</option>
          </select>

          {useCustom && (
            <div className="flex gap-2">
              <input
                type="text"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                placeholder="Art style prompt (영문)"
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              />
              <button
                onClick={handleCustomApply}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors shrink-0"
              >
                적용
              </button>
            </div>
          )}
        </div>

        {/* 이미지 드래그앤드랍 스타일 분석 */}
        <div className="space-y-3">
          <label className={labelClass}>참고 이미지로 스타일 추출</label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900'
            }`}
          >
            {analyzing ? (
              <div className="flex items-center justify-center gap-2 text-violet-600">
                <div className="animate-spin w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full" />
                <span className="text-sm">스타일 분석 중...</span>
              </div>
            ) : (
              <>
                <svg
                  className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  이미지를 드래그하거나 클릭해서 업로드
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Gemini가 이미지의 그림체를 분석합니다
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAnalyzeFile(file);
              e.target.value = '';
            }}
          />

          {extractedStyle && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">추출된 스타일 프롬프트:</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">{extractedStyle}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyExtracted}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg transition-colors"
                >
                  이 스타일 적용
                </button>
                <button
                  onClick={() => handleSaveToStyleLibrary(extractedStyle)}
                  disabled={savingStyle}
                  className="px-3 py-1.5 text-xs font-medium border border-violet-200 dark:border-violet-700 text-violet-600 dark:text-violet-400 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors disabled:opacity-50"
                >
                  {savingStyle ? '저장 중...' : '라이브러리에 저장'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 배경음악 섹션 */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">배경음악</h3>

        {/* 현재 BGM */}
        {storybook.backgroundMusicUrl ? (
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5">
            <button
              onClick={toggleBgmPlay}
              className="p-1.5 rounded-lg hover:bg-white text-violet-600 transition-colors"
            >
              {bgmPlaying ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </button>
            <span className="flex-1 text-sm text-slate-600 dark:text-slate-300 truncate">
              {decodeURIComponent(storybook.backgroundMusicUrl.split('/').pop() ?? '')}
            </span>
            <button
              onClick={handleBgmDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
              title="삭제"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            배경음악이 설정되지 않았습니다.
          </p>
        )}

        {/* BGM 볼륨 슬라이더 (뷰어 기본 볼륨) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass}>볼륨 (뷰어 배경음악)</label>
            <span className="text-sm font-semibold text-violet-600 tabular-nums">{bgmVolume}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={bgmVolume}
            onChange={(e) => handleBgmVolumeChange(Number(e.target.value))}
            onMouseUp={commitBgmVolume}
            onTouchEnd={commitBgmVolume}
            onKeyUp={commitBgmVolume}
            className="w-full accent-violet-600 cursor-pointer"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            아이가 책을 읽을 때 들리는 배경음악 볼륨입니다. 기본 30%.
          </p>
        </div>

        {/* BGM 라이브러리 */}
        {bgmLibrary.length > 0 && (
          <div className="space-y-2">
            <label className={labelClass}>배경음악 라이브러리</label>
            <div className="space-y-1.5">
              {bgmLibrary.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    storybook.backgroundMusicUrl === item.url
                      ? 'border-violet-300 bg-violet-50 dark:bg-violet-900/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <button
                    onClick={() => togglePreview(item)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors shrink-0"
                  >
                    {previewingId === item.id ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </button>
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 truncate">
                    {item.title}
                  </span>
                  {storybook.backgroundMusicUrl === item.url ? (
                    <span className="text-xs text-violet-600 font-medium shrink-0">사용 중</span>
                  ) : (
                    <button
                      onClick={() => handleBgmLibrarySelect(item)}
                      className="px-2.5 py-1 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-md transition-colors shrink-0"
                    >
                      선택
                    </button>
                  )}
                  <button
                    onClick={() => handleBgmLibraryDelete(item)}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors shrink-0"
                    title="라이브러리에서 삭제"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* URL 입력 */}
        <div>
          <label className={labelClass}>URL 입력</label>
          <div className="flex gap-2 mt-1">
            <input
              type="url"
              value={bgmUrl}
              onChange={(e) => setBgmUrl(e.target.value)}
              placeholder="https://example.com/music.mp3"
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            />
            <button
              onClick={handleBgmUrlApply}
              disabled={!bgmUrl.trim()}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm rounded-lg transition-colors shrink-0"
            >
              적용
            </button>
          </div>
        </div>

        {/* 파일 업로드 */}
        <div>
          <label className={labelClass}>파일 업로드</label>
          <div className="mt-1">
            <button
              onClick={() => bgmFileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-violet-300 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-violet-600 transition-colors"
            >
              {uploading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full" />
                  업로드 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  mp3, wav, ogg 파일 선택
                </>
              )}
            </button>
            <input
              ref={bgmFileRef}
              type="file"
              accept="audio/mpeg,audio/wav,audio/ogg,audio/mp3"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBgmUpload(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </section>

      {/* 파닉스 음원 라이브러리 (파닉스 전용) */}
      {isPhonics && <PhonicsAudioLibrary />}

      {/* 시스템 사운드 라이브러리 */}
      <SystemSoundsLibrary />

      {/* 그림체 라이브러리 모달 */}
      {showStyleLibrary && (
        <ArtStyleLibraryModal
          currentPrompt={storybook.artStyle}
          onApply={handleApplyFromLibrary}
          onClose={() => setShowStyleLibrary(false)}
        />
      )}
    </div>
  );
}
