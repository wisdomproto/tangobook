import { createContext, useContext, useState, type ReactNode } from 'react';
import { Camera, Blocks } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type InputMode = 'screen' | 'camera';
const BlockInputControl = createContext<ReactNode>(null);
export const useBlockInputControl = () => useContext(BlockInputControl);

/** Screen blocks start immediately. Only an explicit in-game switch starts the camera. */
export function BlockInputGate({
  initialInputMode,
  children,
  onModeSelected,
}: {
  language?: 'ko' | 'en';
  initialInputMode?: InputMode;
  total: number;
  onBack: () => void;
  children: (mode: InputMode) => ReactNode;
  onModeSelected?: (mode: InputMode) => void;
}) {
  const { t } = useTranslation('games');
  const [inputMode, setInputMode] = useState(initialInputMode ?? 'screen');
  const next = inputMode === 'screen' ? 'camera' : 'screen';
  const control = (
    <button
      type="button"
      className="min-h-11 inline-flex items-center justify-center gap-2 rounded-full border border-ink-100 bg-cream-50 px-3 text-sm font-bold text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral-700"
      onClick={() => {
        setInputMode(next);
        onModeSelected?.(next);
      }}
    >
      {next === 'camera' ? <Camera size={21} aria-hidden /> : <Blocks size={21} aria-hidden />}
      <span>{t(next === 'camera' ? 'blockInput.physical' : 'blockInput.screen')}</span>
    </button>
  );
  return (
    <BlockInputControl.Provider value={control}>{children(inputMode)}</BlockInputControl.Provider>
  );
}
