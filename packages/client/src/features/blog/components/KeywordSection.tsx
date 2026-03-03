import React, { useState, useEffect, useRef } from 'react';
import type { NaverKeywordResult } from '@tangobook/shared';
import { blogApi } from '../api/blog.api';

interface KeywordSectionProps {
  keywords: string[];
  onAdd: (keyword: string) => void;
  onRemove: (keyword: string) => void;
  /** 외부에서 주입하는 검색 결과 (AI 자동 설정 등) */
  externalResults?: NaverKeywordResult[];
}

export function KeywordSection({
  keywords,
  onAdd,
  onRemove,
  externalResults,
}: KeywordSectionProps) {
  const [keywordInput, setKeywordInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NaverKeywordResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const prevExternalRef = useRef(externalResults);

  // 외부에서 검색 결과가 변경되면 반영
  useEffect(() => {
    if (
      externalResults &&
      externalResults !== prevExternalRef.current &&
      externalResults.length > 0
    ) {
      setSearchResults(externalResults);
    }
    prevExternalRef.current = externalResults;
  }, [externalResults]);

  const handleKeywordInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = keywordInput.trim();
      if (trimmed) {
        onAdd(trimmed);
        setKeywordInput('');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const results = await blogApi.searchKeywords(searchQuery.trim());
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError(
          '검색 결과가 없습니다. 네이버 검색광고 API 키가 설정되지 않았을 수 있습니다.'
        );
      }
    } catch {
      setSearchError('검색 중 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
        키워드
      </label>

      {/* 키워드 칩 */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-600 rounded-full"
            >
              {kw}
              <button
                onClick={() => onRemove(kw)}
                className="text-violet-400 hover:text-violet-700 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 키워드 입력 */}
      <input
        className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-300"
        placeholder="키워드를 입력하고 Enter"
        value={keywordInput}
        onChange={(e) => setKeywordInput(e.target.value)}
        onKeyDown={handleKeywordInputKeyDown}
      />

      {/* 네이버 키워드 검색 */}
      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
          네이버 키워드 검색량 조회
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-300"
            placeholder="키워드 입력 (쉼표로 여러 개 가능)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
          >
            {searching ? '조회 중...' : '조회'}
          </button>
        </div>

        {searchError && <p className="text-xs text-slate-400">{searchError}</p>}

        {searchResults.length > 0 && (
          <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left py-1.5 px-2">키워드</th>
                  <th className="text-right py-1.5 px-2">월간 검색량</th>
                  <th className="text-right py-1.5 px-2">경쟁도</th>
                  <th className="py-1.5 px-1" />
                </tr>
              </thead>
              <tbody>
                {searchResults.map((result, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-100 dark:border-slate-600/50 hover:bg-white dark:hover:bg-slate-700"
                  >
                    <td className="py-1.5 px-2 text-slate-700 dark:text-slate-200 font-medium">
                      {result.keyword}
                    </td>
                    <td className="py-1.5 px-2 text-right text-slate-600 dark:text-slate-300">
                      {result.totalSearch.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          result.competition === '높음'
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/30'
                            : result.competition === '중간'
                              ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30'
                              : 'bg-green-50 text-green-600 dark:bg-green-900/30'
                        }`}
                      >
                        {result.competition}
                      </span>
                    </td>
                    <td className="py-1.5 px-1">
                      <button
                        onClick={() => onAdd(result.keyword)}
                        disabled={keywords.includes(result.keyword)}
                        className="text-[11px] px-2 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-600 rounded hover:bg-violet-100 disabled:opacity-30"
                      >
                        +
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
