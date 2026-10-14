import { useState, type ReactNode } from 'react';
import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import { PhonicsBackdrop } from '@/features/phonics-learner/components/PhonicsBackdrop';
import { GameHeader } from './GameHeader';
import { LearningGameAction } from './LearningGameAction';
import { gameSafeAreaStyle } from '../lib/game-safe-area';

type InputMode = 'screen' | 'camera';

/** Choose before mounting the player, so the camera starts only after an explicit choice. */
export function BlockInputGate({
  language = 'ko',
  initialInputMode,
  total,
  onBack,
  children,
}: {
  language?: 'ko' | 'en';
  initialInputMode?: InputMode;
  total: number;
  onBack: () => void;
  children: (mode: InputMode) => ReactNode;
}) {
  const { t } = useTranslation('games');
  const [inputMode, setInputMode] = useState(initialInputMode);
  if (inputMode) return children(inputMode);
  return (
    <div
      className="storybook-scope learning-stage korean-block-entry fixed inset-0 z-[60] flex flex-col overflow-hidden"
      style={gameSafeAreaStyle()}
    >
      <PhonicsBackdrop />
      <div className="px-2 pt-2 shrink-0">
        <GameHeader
          title={t(language === 'en' ? 'cards.block.labelEn' : 'cards.block.labelKo')}
          current={0}
          total={total}
          onBack={onBack}
        />
      </div>
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center gap-8 px-6">
        <h1 className="text-2xl sm:text-3xl font-display font-black text-ink-900">
          어떤 블록으로 만들까요?
        </h1>
        <div className="flex items-center justify-center gap-6 sm:gap-12">
          <LearningGameAction
            language="ko"
            onClick={() => setInputMode('screen')}
            className="korean-block-entry-choice"
          >
            <StorybookSprite name="combine" size={72} />
            <span>화면 블록</span>
          </LearningGameAction>
          <LearningGameAction
            language="en"
            onClick={() => setInputMode('camera')}
            className="korean-block-entry-choice"
          >
            <Camera size={64} aria-hidden />
            <span>실물 블록</span>
          </LearningGameAction>
        </div>
      </div>
    </div>
  );
}
