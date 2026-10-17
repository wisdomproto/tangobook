import { create } from 'zustand';
import type { JourneyLanguage } from './learning-journey';

type Section = 'letters' | 'words';
/** Navigation preference only; never written to learning or mastery records. */
export const useFreePlayShelf = create<{
  sections: Record<JourneyLanguage, Section>;
  choose: (lang: JourneyLanguage, section: Section) => void;
}>((set) => ({
  sections: { korean: 'letters', english: 'letters' },
  choose: (lang, section) => set((state) => ({ sections: { ...state.sections, [lang]: section } })),
}));
