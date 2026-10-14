import { createContext } from 'react';

export const JourneyActivityContext = createContext<null | {
  ready: boolean;
  onNext: () => void;
  step: number;
  total: number;
  tutorial?: 'press' | 'write' | 'choose';
}>(null);
