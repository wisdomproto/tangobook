import { createContext, useContext, type ReactNode } from 'react';

/**
 * 학습 게임이 동화책 wrapping 인지 어휘 단원 wrapping 인지 알리는 컨텍스트.
 * VocabularyStudyPage 가 게임 모달을 띄울 때 이 컨텍스트로 wrap 하면,
 * 그 안의 player 들이 호출하는 useGameLogger 가 자동으로 source='vocabulary' 로 emit.
 *
 * default = null (= storybook 모드).
 */
interface VocabSourceValue {
  source: 'vocabulary';
  unitId: string;
}

const VocabSourceContext = createContext<VocabSourceValue | null>(null);

export function VocabSourceProvider({ unitId, children }: { unitId: string; children: ReactNode }) {
  return (
    <VocabSourceContext.Provider value={{ source: 'vocabulary', unitId }}>
      {children}
    </VocabSourceContext.Provider>
  );
}

export function useVocabSource(): VocabSourceValue | null {
  return useContext(VocabSourceContext);
}
