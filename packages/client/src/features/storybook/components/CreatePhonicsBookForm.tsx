import { useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { TextModelSelector } from '@/components/TextModelSelector';
import { useGeneratePhonicsBook } from '../hooks/useStorybookMutations';
import { storybookApi } from '../api/storybook.api';
import { characterApi } from '@/features/character/api/character.api';
import { useEditorStore } from '@/store/editor.store';
import {
  TARGET_AGES,
  ART_STYLES,
  DEFAULT_TEXT_MODEL,
  ENGLISH_PHONICS_CURRICULUM,
  KOREAN_PHONICS_CURRICULUM,
  KOREAN_UNIT_STORY_DEFAULTS,
  ENGLISH_UNIT_STORY_DEFAULTS,
  HANGUL_FOREST_CHARACTER_NAMES,
} from '@tangobook/shared';

export function CreatePhonicsBookForm() {
  const generateMutation = useGeneratePhonicsBook();
  const qc = useQueryClient();
  const setSelectedId = useEditorStore((s) => s.setSelectedStorybookId);
  const setShowCreateForm = useEditorStore((s) => s.setShowCreateForm);
  const sidebarTypeFilter = useEditorStore((s) => s.sidebarTypeFilter);

  // 사이드바 필터에 따라 언어 고정
  const language: 'english' | 'korean' = sidebarTypeFilter === 'phonics-ko' ? 'korean' : 'english';

  const [title, setTitle] = useState('');
  const [targetAge, setTargetAge] = useState<(typeof TARGET_AGES)[number]>(TARGET_AGES[0]);
  const [level, setLevel] = useState('');
  const [unitId, setUnitId] = useState('');
  const [storyTheme, setStoryTheme] = useState('');
  const [textModel, setTextModel] = useState(DEFAULT_TEXT_MODEL as string);
  // 자동 채워진 스토리 테마인지 추적 (유닛 변경 시 덮어쓰기 여부 판단)
  const autoFilledRef = useRef(false);

  const curriculum =
    language === 'english' ? ENGLISH_PHONICS_CURRICULUM : KOREAN_PHONICS_CURRICULUM;

  // 레벨이 바뀌면 유닛 초기화
  const levels = curriculum;
  const selectedLevel = useMemo(() => levels.find((l) => l.level === level), [levels, level]);
  const units = selectedLevel?.units ?? [];

  const handleLevelChange = (lv: string) => {
    setLevel(lv);
    setUnitId('');
    // 레벨 변경 시 자동 채워진 테마 초기화
    if (autoFilledRef.current) {
      setStoryTheme('');
      autoFilledRef.current = false;
    }
  };

  const handleUnitChange = (newUnitId: string) => {
    setUnitId(newUnitId);
    // 유닛 선택 시 기본 스토리 테마 자동 채우기
    if (newUnitId) {
      const defaults =
        language === 'korean'
          ? KOREAN_UNIT_STORY_DEFAULTS[newUnitId]
          : ENGLISH_UNIT_STORY_DEFAULTS[newUnitId];
      if (defaults && (storyTheme === '' || autoFilledRef.current)) {
        setStoryTheme(defaults.storyTheme);
        autoFilledRef.current = true;
      }
    }
  };

  const handleStoryThemeChange = (value: string) => {
    setStoryTheme(value);
    // 사용자가 직접 수정하면 자동 채우기 플래그 해제
    autoFilledRef.current = false;
  };

  const handleGenerate = () => {
    if (!title.trim() || !level || !unitId) return;
    generateMutation.mutate(
      {
        title: title.trim(),
        targetAge,
        artStyle: ART_STYLES[0].prompt,
        language,
        level,
        unitId,
        storyTheme: storyTheme.trim() || undefined,
        model: textModel,
      },
      {
        onSuccess: async (data) => {
          // 유닛: 캐릭터 라이브러리에서 불러오기 (없으면 AI 생성본 사용)
          // 중요: setSelectedId 전에 저장해야 에디터가 최신 데이터를 로드함
          let finalData = data;
          if (unitId) {
            const defaults =
              language === 'korean'
                ? KOREAN_UNIT_STORY_DEFAULTS[unitId]
                : ENGLISH_UNIT_STORY_DEFAULTS[unitId];
            if (defaults?.characterNames.length) {
              try {
                const library = await characterApi.getLibrary();
                const libByName = new Map(library.map((c) => [c.name, c]));
                const libByNameEn = new Map(
                  library.filter((c) => c.nameEn).map((c) => [c.nameEn!.toLowerCase(), c])
                );

                const characters = defaults.characterNames.map((korName) => {
                  const lib = libByName.get(korName);
                  if (lib) {
                    const { id: _id, createdAt: _ca, ...character } = lib;
                    if (language === 'english' && character.nameEn) {
                      return { ...character, name: character.nameEn };
                    }
                    return character;
                  }
                  const aiChar = (data.characters ?? []).find((ch) => {
                    if (language === 'english') {
                      const libMatch = libByNameEn.get(ch.name.toLowerCase());
                      return libMatch?.name === korName;
                    }
                    return ch.name.toLowerCase() === korName.toLowerCase();
                  });
                  return aiChar ?? { name: korName, description: '', role: '', height: 1 };
                });

                finalData = await storybookApi.save({
                  ...data,
                  characters,
                });
              } catch {
                // 라이브러리 불러오기 실패 시 AI 생성본 사용
              }
            }
          }
          qc.setQueryData(['storybook', finalData.id], finalData);
          setSelectedId(finalData.id);
        },
      }
    );
  };

  // Loading state
  if (generateMutation.isPending) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-emerald-600 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
            AI가 파닉스 유닛을 만들고 있어요...
          </h3>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
            <div
              className="bg-emerald-600 h-2 rounded-full animate-pulse"
              style={{ width: '40%' }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            스토리 + 챈트 + 플래시카드 + 워크시트 + 퀴즈를 한 번에 생성합니다 (30-60초)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="mb-8">
        <button
          onClick={() => setShowCreateForm(false)}
          className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          &larr; 돌아가기
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">
          새 {language === 'korean' ? '한글' : '영어'} 파닉스 유닛 만들기
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          커리큘럼을 선택하면 AI가 스토리, 챈트, 플래시카드, 워크시트, 퀴즈를 자동 생성합니다.
        </p>
      </div>

      <div className="space-y-5">
        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: The Cat on the Mat"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
          />
        </div>

        {/* 대상 연령 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            대상 연령
          </label>
          <div className="flex gap-2">
            {TARGET_AGES.map((age) => (
              <button
                key={age}
                onClick={() => setTargetAge(age)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  targetAge === age
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {age}세
              </button>
            ))}
          </div>
        </div>

        {/* 레벨 선택 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            레벨
          </label>
          <select
            value={level}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
          >
            <option value="">레벨을 선택하세요</option>
            {levels.map((lv) => (
              <option key={lv.level} value={lv.level}>
                {lv.name}
              </option>
            ))}
          </select>
          {selectedLevel && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {selectedLevel.description}
            </p>
          )}
        </div>

        {/* 유닛 선택 */}
        {level && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              유닛
            </label>
            <select
              value={unitId}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            >
              <option value="">유닛을 선택하세요</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
            {unitId &&
              (() => {
                const unit = units.find((u) => u.id === unitId);
                if (!unit) return null;
                return (
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p>
                      <span className="font-medium">음소:</span> {unit.phonemes.join(', ')}
                    </p>
                    <p>
                      <span className="font-medium">패턴:</span> {unit.patterns.join(', ')}
                    </p>
                    <p>
                      <span className="font-medium">예시 단어:</span>{' '}
                      {unit.sampleWords.slice(0, 8).join(', ')}
                      {unit.sampleWords.length > 8 ? '...' : ''}
                    </p>
                    {(() => {
                      const defaults =
                        language === 'korean'
                          ? KOREAN_UNIT_STORY_DEFAULTS[unitId]
                          : ENGLISH_UNIT_STORY_DEFAULTS[unitId];
                      if (!defaults) return null;
                      const displayNames =
                        language === 'english'
                          ? defaults.characterNames.map(
                              (n) => HANGUL_FOREST_CHARACTER_NAMES[n] ?? n
                            )
                          : defaults.characterNames;
                      return (
                        <p>
                          <span className="font-medium">등장 캐릭터:</span>{' '}
                          {displayNames.join(', ')}
                        </p>
                      );
                    })()}
                  </div>
                );
              })()}
          </div>
        )}

        {/* 스토리 테마 (선택) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            스토리 테마 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <input
            type="text"
            value={storyTheme}
            onChange={(e) => handleStoryThemeChange(e.target.value)}
            placeholder="예: 동물 친구들의 소풍, 마법의 숲 모험"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
          />
        </div>

        {/* 텍스트 모델 */}
        <TextModelSelector value={textModel} onChange={setTextModel} layout="block" />

        {/* 에러 */}
        {generateMutation.isError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {generateMutation.error?.message || '생성에 실패했습니다.'}
            </p>
          </div>
        )}

        {/* 생성 버튼 */}
        <Button
          onClick={handleGenerate}
          disabled={!title.trim() || !level || !unitId}
          className="w-full !bg-emerald-600 hover:!bg-emerald-700 disabled:!bg-slate-300"
        >
          파닉스 유닛 생성하기
        </Button>
      </div>
    </div>
  );
}
