import { useTranslation } from 'react-i18next';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import './listening-block-prompt.css';
export function WritingHintButton({
  visible,
  onToggle,
  word,
}: {
  visible: boolean;
  onToggle: () => void;
  word: string;
}) {
  const { t } = useTranslation('phonics');
  return (
    <div className="writing-help">
      <button
        type="button"
        className="listening-block-hint-button writing-hint-button"
        aria-pressed={visible}
        onClick={onToggle}
      >
        <StorybookSprite name="book" size={25} />
        <span>{t('playHelp.wholeWord')}</span>
      </button>
      {visible && <output className="writing-help-word">{word}</output>}
    </div>
  );
}
