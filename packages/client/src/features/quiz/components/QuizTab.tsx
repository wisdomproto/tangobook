import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { quizApi } from '../api/quiz.api';
import type { Storybook } from '@tangobook/shared';

interface QuizTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
  '4-5': 'easy',
  '5-7': 'medium',
  '7-8': 'hard',
};

export function QuizTab({ storybook, onUpdate, onSave }: QuizTabProps) {
  const quiz = storybook.educational_content.quiz;

  const generateMutation = useMutation({
    mutationFn: () =>
      quizApi.generate({
        storyTitle: storybook.title,
        pages: storybook.pages.map((p) => ({ text: p.text })),
        difficulty: difficultyMap[storybook.targetAge] ?? 'medium',
        count: 5,
      }),
    onSuccess: (results) => {
      onUpdate((draft) => {
        draft.educational_content.quiz = results;
      });
      onSave();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          퀴즈 ({quiz.length}문항)
        </h2>
        <Button
          size="sm"
          onClick={() => generateMutation.mutate()}
          loading={generateMutation.isPending}
        >
          퀴즈 생성
        </Button>
      </div>

      {/* Learning objectives */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">학습 목표</h3>
        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
          {storybook.educational_content.learning_objectives.map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
          <span className="font-medium">교훈:</span> {storybook.educational_content.moral_lesson}
        </p>
      </div>

      {/* Quiz questions */}
      {quiz.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          퀴즈가 없습니다. "퀴즈 생성" 버튼을 눌러 생성하세요.
        </p>
      ) : (
        <div className="space-y-4">
          {quiz.map((q, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
            >
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-3">
                <span className="text-violet-600">Q{idx + 1}.</span> {q.question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      oi === q.correctAnswer
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="inline-block w-5">{oi === q.correctAnswer ? '●' : '○'}</span>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {generateMutation.isError && (
        <p className="text-sm text-red-500">{generateMutation.error.message}</p>
      )}
    </div>
  );
}
