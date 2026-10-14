import type { ButtonHTMLAttributes } from 'react';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import '@/features/phonics-learner/components/phonics-game-refinements.css';

/** One compact illustrated action; game tiles remain distinct from navigation. */
export function LearningGameAction({
  language,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { language: 'ko' | 'en' }) {
  return (
    <button type="button" {...props} className={`learning-game-action ${className}`}>
      <StorybookSprite
        name={language === 'en' ? 'cta-mint' : 'cta-coral'}
        className="learning-game-action-art"
      />
      <span className="learning-game-action-label">{children}</span>
    </button>
  );
}
