import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { PhonicsAudioCategory, PhonicsAudioItem } from '@tangobook/shared';
import { settingsApi } from '../api/settings.api';

type Library = {
  mod_phonics: PhonicsAudioItem[];
  mod_english: PhonicsAudioItem[];
  mod_korean: PhonicsAudioItem[];
};

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

export function PhonicsAudioLibrary() {
  const [library, setLibrary] = useState<Library>({
    mod_phonics: [],
    mod_english: [],
    mod_korean: [],
  });
  const [activeTab, setActiveTab] = useState<PhonicsAudioCategory>('mod_phonics');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [deletingSound, setDeletingSound] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchLibrary = useCallback(async () => {
    try {
      const data = await settingsApi.getPhonicsLibrary();
      setLibrary(data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const uploadFiles = useCallback(
    async (mp3Files: File[]) => {
      if (mp3Files.length === 0) return;
      setUploading(true);
      setUploadProgress(`0 / ${mp3Files.length}`);
      let uploaded = 0;
      let failed = 0;
      try {
        for (let i = 0; i < mp3Files.length; i += BATCH_SIZE) {
          const batch = mp3Files.slice(i, i + BATCH_SIZE);
          try {
            await settingsApi.uploadPhonicsAudio(batch, activeTab);
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
        setUploading(false);
        setUploadProgress('');
      }
    },
    [activeTab, fetchLibrary]
  );

  const handleFileInput = (files: FileList) => {
    const mp3Files = Array.from(files).filter((f) => f.name.toLowerCase().endsWith('.mp3'));
    uploadFiles(mp3Files);
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragOver(false);

      const items = e.dataTransfer.items;
      if (!items || items.length === 0) return;

      const entries: FileSystemEntry[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) entries.push(entry);
      }

      if (entries.length > 0) {
        const mp3Files = await collectMp3Files(entries);
        uploadFiles(mp3Files);
      } else {
        const mp3Files = Array.from(e.dataTransfer.files).filter((f) =>
          f.name.toLowerCase().endsWith('.mp3')
        );
        uploadFiles(mp3Files);
      }
    },
    [uploadFiles]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDelete = async (item: PhonicsAudioItem) => {
    setDeletingSound(item.sound);
    try {
      await settingsApi.deletePhonicsAudio(item.category, item.sound);
      setLibrary((prev) => ({
        ...prev,
        [item.category]: prev[item.category].filter((i) => i.sound !== item.sound),
      }));
    } catch {
      /* silent */
    } finally {
      setDeletingSound(null);
    }
  };

  const handleDeleteAll = async () => {
    const count = library[activeTab].length;
    if (count === 0) return;
    if (!window.confirm(`${activeTab} 카테고리의 음원 ${count}개를 모두 삭제하시겠습니까?`)) return;
    setDeletingAll(true);
    try {
      await settingsApi.deleteAllPhonicsAudio(activeTab);
      setLibrary((prev) => ({ ...prev, [activeTab]: [] }));
      setSearchQuery('');
    } catch {
      /* silent */
    } finally {
      setDeletingAll(false);
    }
  };

  const togglePlay = (item: PhonicsAudioItem) => {
    if (playingSound === item.sound) {
      audioRef.current?.pause();
      setPlayingSound(null);
      return;
    }
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = item.url;
    audioRef.current.currentTime = 0;
    audioRef.current.onended = () => setPlayingSound(null);
    audioRef.current.play().catch(() => {});
    setPlayingSound(item.sound);
  };

  const allItems = library[activeTab];
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase();
    return allItems.filter((item) => item.sound.toLowerCase().includes(q));
  }, [allItems, searchQuery]);

  const tabs: { key: PhonicsAudioCategory; label: string }[] = [
    { key: 'mod_phonics', label: 'MOD Phonics' },
    { key: 'mod_english', label: 'MOD English' },
    { key: 'mod_korean', label: 'MOD Korean' },
  ];

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
        파닉스 음원 라이브러리
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        파닉스 학습에 사용할 MP3 음원을 카테고리별로 업로드합니다. 파일명이 음원 이름이 됩니다.
        폴더를 드래그하면 하위 폴더 포함 모든 MP3를 자동 수집합니다.
      </p>

      {/* 탭 */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setPlayingSound(null);
              setSearchQuery('');
            }}
            className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">
              ({library[tab.key].length})
            </span>
          </button>
        ))}
      </div>

      {/* 드래그앤드롭 + 업로드 영역 */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver
            ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-violet-600">
            <div className="animate-spin w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full" />
            <span className="text-sm">업로드 중... {uploadProgress}</span>
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              MP3 파일 또는 폴더를 드래그하세요
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              하위 폴더의 MP3도 자동으로 수집됩니다
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              파일 선택
            </button>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFileInput(e.target.files);
          e.target.value = '';
        }}
      />

      {/* 검색 + 파일 목록 */}
      {allItems.length > 0 && (
        <div className="space-y-2">
          {/* 검색 + 전체 삭제 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="음원 검색..."
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            />
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll || uploading}
              className="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {deletingAll ? '삭제 중...' : `전체 삭제 (${allItems.length})`}
            </button>
          </div>

          {/* 스크롤 가능한 목록 */}
          <div className="max-h-80 overflow-y-auto space-y-1 rounded-lg">
            {filteredItems.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
                검색 결과가 없습니다.
              </p>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.sound}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <button
                    onClick={() => togglePlay(item)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors shrink-0"
                    title="재생"
                  >
                    {playingSound === item.sound ? (
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
                    {item.sound}
                  </span>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingSound === item.sound}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    title="삭제"
                  >
                    {deletingSound === item.sound ? (
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
              ))
            )}
          </div>

          {/* 필터 결과 카운트 */}
          {searchQuery.trim() && (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-right">
              {filteredItems.length} / {allItems.length}
            </p>
          )}
        </div>
      )}

      {allItems.length === 0 && !uploading && (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
          업로드된 음원이 없습니다.
        </p>
      )}
    </section>
  );
}
