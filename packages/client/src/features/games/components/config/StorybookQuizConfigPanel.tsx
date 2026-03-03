import type { GameConfigPanelProps } from '../../registry/game-registry';
import type { StorybookQuizConfig } from '@tangobook/shared';
import { NumberSelector } from './ConfigControls';

export function StorybookQuizConfigPanel({ config, onChange, storybook }: GameConfigPanelProps) {
  const c = config as StorybookQuizConfig;
  const quizCount = storybook?.educational_content?.quiz?.length ?? 0;

  return (
    <div className="space-y-4">
      <NumberSelector
        label="문제 수"
        value={c.questionCount}
        options={[3, 5, 10].filter((n) => n <= quizCount || quizCount === 0)}
        onChange={(n) => onChange({ ...c, questionCount: n })}
        suffix="문제"
      />
      {quizCount > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          사용 가능한 퀴즈: {quizCount}개
        </p>
      )}
    </div>
  );
}
