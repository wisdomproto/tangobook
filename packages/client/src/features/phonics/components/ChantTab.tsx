import { useState } from 'react';
import type { Storybook } from '@tangobook/shared';
import { phonicsApi } from '../api/phonics.api';
import { TtsControl } from '@/components/TtsControl';

interface ChantTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function ChantTab({ storybook, onUpdate, onSave }: ChantTabProps) {
  const chant = storybook.chant;
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTts = async () => {
    if (!chant) return;
    setGenerating(true);
    setError(null);
    try {
      const fullText = chant.lyrics.map((l) => l.text).join('\n');
      const { audioUrl } = await phonicsApi.generateWordTts({
        text: fullText,
        provider: 'gemini',
        language: storybook.phonicsConfig?.language === 'korean' ? 'ko' : 'en',
        storybookId: storybook.id,
        identifier: 'chant-tts',
      });
      onUpdate((d) => {
        d.chant!.ttsUrl = audioUrl;
      });
      onSave();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  if (!chant) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <p className="text-lg mb-2">챈트가 없습니다</p>
        <p className="text-sm">파닉스 유닛을 생성하면 챈트가 자동으로 포함됩니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 챈트 제목 + 메타 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
          {chant.title}
        </h3>
        <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
          {chant.bpm && <span>BPM: {chant.bpm}</span>}
          {chant.tone && <span>분위기: {chant.tone}</span>}
        </div>
      </div>

      {/* 가사 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">가사</h4>
        <div className="space-y-2">
          {chant.lyrics.map((line, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 w-6 text-right flex-shrink-0">
                {idx + 1}
              </span>
              <p className="text-slate-800 dark:text-slate-100">
                {line.highlightWords?.length
                  ? highlightText(line.text, line.highlightWords)
                  : line.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* TTS */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">챈트 TTS</h4>
        <TtsControl
          layout="full"
          url={chant.ttsUrl}
          label={chant.ttsUrl ? '챈트 TTS' : '챈트 TTS 생성'}
          generating={generating}
          disabled={generating}
          downloadFilename={chant.ttsUrl ? 'chant.wav' : undefined}
          onGenerate={handleGenerateTts}
        />
        {!chant.ttsUrl && !generating && (
          <p className="mt-2 text-xs text-slate-400">가사 전체를 음성으로 변환합니다</p>
        )}
        {error && <p className="mt-2 text-sm text-red-500">TTS 생성 실패: {error}</p>}
      </div>

      {/* BGM */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">BGM</h4>

        {chant.bgmUrl ? (
          <div className="space-y-3">
            <audio controls src={chant.bgmUrl} className="w-full" />
            {chant.bgmPreset && <p className="text-xs text-slate-400">프리셋: {chant.bgmPreset}</p>}
          </div>
        ) : chant.bgmPreset ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            프리셋:{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {chant.bgmPreset}
            </span>
            <span className="ml-2 text-slate-400">(BGM 미생성)</span>
          </p>
        ) : (
          <p className="text-sm text-slate-400">BGM이 설정되지 않았습니다</p>
        )}
      </div>
    </div>
  );
}

function highlightText(text: string, words: string[]) {
  if (!words.length) return text;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span
        key={i}
        className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-0.5 rounded font-medium"
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}
