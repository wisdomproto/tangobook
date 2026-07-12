import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  SYSTEM_SOUND_LANGUAGES,
  type SystemSoundLanguage,
  type SystemSoundType,
  type SystemSoundItem,
} from '@tangobook/shared';
import { settingsApi } from '../api/settings.api';

type SoundsLibrary = Record<
  SystemSoundLanguage,
  { correct: SystemSoundItem[]; wrong: SystemSoundItem[] }
>;

const EMPTY_LIBRARY: SoundsLibrary = Object.fromEntries(
  SYSTEM_SOUND_LANGUAGES.map((l) => [l, { correct: [], wrong: [] }])
) as unknown as SoundsLibrary;

/** FileSystemEntry에서 재귀적으로 모든 .mp3 File을 수집 */
async function collectMp3Files(entries: FileSystemEntry[]): Promise<File[]> {
  const files: File[] = [];

  async function readEntry(entry: FileSystemEntry) {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => fileEntry.file(resolve, reject));
      if (file.name.toLowerCase().endsWith('.mp3')) {
        files.push(file);
      }
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      let batch: FileSystemEntry[];
      do {
        batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
          reader.readEntries(resolve, reject)
        );
        for (const child of batch) {
          await readEntry(child);
        }
      } while (batch.length > 0);
    }
  }

  for (const entry of entries) {
    await readEntry(entry);
  }
  return files;
}

const BATCH_SIZE = 5;

const LANG_TABS: { key: SystemSoundLanguage; label: string }[] = [
  { key: 'korean', label: '한글' },
  { key: 'english', label: '영어' },
  { key: 'vietnamese', label: '베트남어' },
  { key: 'chinese', label: '중국어' },
  { key: 'thai', label: '태국어' },
];

const SOUND_SECTIONS: { key: SystemSoundType; label: string; emoji: string }[] = [
  { key: 'correct', label: '정답 효과음', emoji: '\u2705' },
  { key: 'wrong', label: '오답 효과음', emoji: '\u274C' },
];

export function SystemSoundsLibrary() {
  const [library, setLibrary] = useState<SoundsLibrary>(EMPTY_LIBRARY);
  const [activeLang, setActiveLang] = useState<SystemSoundLanguage>('korean');
  const [uploading, setUploading] = useState<SystemSoundType | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const [playingName, setPlayingName] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState<SystemSoundType | null>(null);
  const [dragOverType, setDragOverType] = useState<SystemSoundType | null>(null);
  const dragCounters = useRef<Record<SystemSoundType, number>>({ correct: 0, wrong: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingType = useRef<SystemSoundType>('correct');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchLibrary = useCallback(async () => {
    try {
      const data = await settingsApi.getSystemSounds();
      setLibrary(data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const uploadFiles = useCallback(
    async (mp3Files: File[], type: SystemSoundType) => {
      if (mp3Files.length === 0) return;
      setUploading(type);
      setUploadProgress(`0 / ${mp3Files.length}`);
      let uploaded = 0;
      let failed = 0;
      try {
        for (let i = 0; i < mp3Files.length; i += BATCH_SIZE) {
          const batch = mp3Files.slice(i, i + BATCH_SIZE);
          try {
            await settingsApi.uploadSystemSounds(batch, activeLang, type);
          } catch {
            failed += batch.length;
          }
          uploaded += batch.length;
          setUploadProgress(
            `${uploaded} / ${mp3Files.length}${failed > 0 ? ` (실패 ${failed})` : ''}`
          );
        }
        await fetchLibrary();
      } catch {
        /* silent */
      } finally {
        setUploading(null);
        setUploadProgress('');
      }
    },
    [activeLang, fetchLibrary]
  );

  const handleDrop = useCallback(
    (type: SystemSoundType) => async (e: React.DragEvent) => {
      e.preventDefault();
      dragCounters.current[type] = 0;
      setDragOverType(null);

      const items = e.dataTransfer.items;
      if (!items || items.length === 0) return;

      const entries: FileSystemEntry[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) entries.push(entry);
      }

      if (entries.length > 0) {
        const mp3Files = await collectMp3Files(entries);
        uploadFiles(mp3Files, type);
      } else {
        const mp3Files = Array.from(e.dataTransfer.files).filter((f) =>
          f.name.toLowerCase().endsWith('.mp3')
        );
        uploadFiles(mp3Files, type);
      }
    },
    [uploadFiles]
  );

  const handleDragEnter = useCallback(
    (type: SystemSoundType) => (e: React.DragEvent) => {
      e.preventDefault();
      dragCounters.current[type] += 1;
      setDragOverType(type);
    },
    []
  );

  const handleDragLeave = useCallback(
    (type: SystemSoundType) => (e: React.DragEvent) => {
      e.preventDefault();
      dragCounters.current[type] -= 1;
      if (dragCounters.current[type] <= 0) {
        dragCounters.current[type] = 0;
        setDragOverType((prev) => (prev === type ? null : prev));
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDelete = async (item: SystemSoundItem) => {
    setDeletingName(item.name);
    try {
      await settingsApi.deleteSystemSound(item.language, item.type, item.name);
      setLibrary((prev) => ({
        ...prev,
        [item.language]: {
          ...prev[item.language],
          [item.type]: prev[item.language][item.type].filter((i) => i.name !== item.name),
        },
      }));
    } catch {
      /* silent */
    } finally {
      setDeletingName(null);
    }
  };

  const handleDeleteAll = async (type: SystemSoundType) => {
    const count = library[activeLang][type].length;
    if (count === 0) return;
    if (
      !window.confirm(
        `${type === 'correct' ? '정답' : '오답'} 효과음 ${count}개를 모두 삭제하시겠습니까?`
      )
    )
      return;
    setDeletingAll(type);
    try {
      await settingsApi.deleteAllSystemSounds(activeLang, type);
      setLibrary((prev) => ({
        ...prev,
        [activeLang]: { ...prev[activeLang], [type]: [] },
      }));
    } catch {
      /* silent */
    } finally {
      setDeletingAll(null);
    }
  };

  const togglePlay = (item: SystemSoundItem) => {
    if (playingName === item.name) {
      audioRef.current?.pause();
      setPlayingName(null);
      return;
    }
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = item.url;
    audioRef.current.currentTime = 0;
    audioRef.current.onended = () => setPlayingName(null);
    audioRef.current.play().catch(() => {});
    setPlayingName(item.name);
  };

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
        시스템 사운드 라이브러리
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        게임/학습에서 사용할 정답/오답 효과음을 언어별로 관리합니다. 파일명이 음원 이름이 됩니다.
      </p>

      {/* 언어 탭 */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        {LANG_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveLang(tab.key);
              setPlayingName(null);
            }}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeLang === tab.key
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 정답/오답 섹션 */}
      {SOUND_SECTIONS.map((section) => {
        const items = library[activeLang][section.key];
        const isUploading = uploading === section.key;
        const isDragOver = dragOverType === section.key;
        const isDeletingAllSection = deletingAll === section.key;

        return (
          <div key={section.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{section.emoji}</span>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {section.label}
              </h4>
              <span className="text-xs text-slate-400 dark:text-slate-500">({items.length})</span>
            </div>

            {/* 드래그앤드롭 영역 */}
            <div
              onDragEnter={handleDragEnter(section.key)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave(section.key)}
              onDrop={handleDrop(section.key)}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                isDragOver
                  ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2 text-violet-600">
                  <div className="animate-spin w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full" />
                  <span className="text-sm">업로드 중... {uploadProgress}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    MP3 파일을 드래그하거나
                  </p>
                  <button
                    onClick={() => {
                      pendingType.current = section.key;
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg transition-colors"
                  >
                    파일 선택
                  </button>
                </div>
              )}
            </div>

            {/* 파일 목록 */}
            {items.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDeleteAll(section.key)}
                    disabled={isDeletingAllSection || isUploading}
                    className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  >
                    {isDeletingAllSection ? '삭제 중...' : `전체 삭제 (${items.length})`}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg">
                  {items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <button
                        onClick={() => togglePlay(item)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors shrink-0"
                        title="재생"
                      >
                        {playingName === item.name ? (
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
                      <span className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deletingName === item.name}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                        title="삭제"
                      >
                        {deletingName === item.name ? (
                          <div className="w-4 h-4 animate-spin border-2 border-red-400 border-t-transparent rounded-full" />
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 공용 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const mp3Files = Array.from(e.target.files).filter((f) =>
              f.name.toLowerCase().endsWith('.mp3')
            );
            uploadFiles(mp3Files, pendingType.current);
          }
          e.target.value = '';
        }}
      />
    </section>
  );
}
