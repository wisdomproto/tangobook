import { useState } from 'react';
import type { BlogGenerateConfig, NaverKeywordResult } from '@tangobook/shared';
import { DEFAULT_TEXT_MODEL } from '@tangobook/shared';
import { TextModelSelector } from '@/components/TextModelSelector';
import { blogApi } from '../api/blog.api';
import { KeywordSection } from './KeywordSection';

interface BlogConfigFormProps {
  storybookId: string;
  storybookTitle: string;
  onGenerate: (config: BlogGenerateConfig) => void;
  onCancel: () => void;
  generating: boolean;
}

export function BlogConfigForm({
  storybookId,
  storybookTitle,
  onGenerate,
  onCancel,
  generating,
}: BlogConfigFormProps) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [model, setModel] = useState<string>(DEFAULT_TEXT_MODEL);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [autoFilling, setAutoFilling] = useState(false);
  const [externalResults, setExternalResults] = useState<NaverKeywordResult[]>();

  const addKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleAutoFill = async () => {
    setAutoFilling(true);
    try {
      const config = await blogApi.generateConfig(storybookId);
      setTitle(config.title);
      setTopic(config.topic);
      if (config.keywords.length > 0) {
        setExternalResults(config.keywords);
        setKeywords(config.keywords.map((k) => k.keyword));
      }
    } catch {
      alert('자동 생성에 실패했습니다.');
    } finally {
      setAutoFilling(false);
    }
  };

  const handleSubmit = () => {
    onGenerate({
      storybookId,
      title: title.trim() || undefined,
      topic: topic.trim() || undefined,
      keywords: keywords.length > 0 ? keywords : undefined,
      model,
    });
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800 dark:text-white">블로그 글 설정</h3>
        <button
          onClick={handleAutoFill}
          disabled={autoFilling || generating}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50"
        >
          {autoFilling ? (
            <>
              <span className="animate-spin">⏳</span> AI 분석 중...
            </>
          ) : (
            <>🤖 AI 자동 설정</>
          )}
        </button>
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          블로그 제목 (선택)
        </label>
        <input
          className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-300"
          placeholder={`예: "${storybookTitle}" 동화로 아이와 함께하는 독서 활동`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="text-xs text-slate-400 mt-1">비워두면 AI가 자동으로 제목을 생성합니다.</p>
      </div>

      {/* 주제/방향 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          주제/방향 (선택)
        </label>
        <textarea
          className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
          rows={2}
          placeholder="예: 독서 활동 소개, 파닉스 학습법, 유아 영어 교육 등"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>

      {/* AI 모델 */}
      <TextModelSelector value={model} onChange={setModel} layout="block" />

      {/* 키워드 */}
      <KeywordSection
        keywords={keywords}
        onAdd={addKeyword}
        onRemove={removeKeyword}
        externalResults={externalResults}
      />

      {/* 버튼 */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-600">
        <button
          onClick={onCancel}
          className="text-sm px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={generating}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <span className="animate-spin">⏳</span> 생성 중...
            </>
          ) : (
            <>✨ 블로그 글 생성</>
          )}
        </button>
      </div>
    </div>
  );
}
