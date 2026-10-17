import { createContext, useContext } from 'react';
import type { WordLearningStage } from '../lib/word-learning-run';

export interface WorkspaceWordActivity {
  unitId: string;
  word: string;
  stage: WordLearningStage;
}

export interface LearningWorkspace {
  mode?: 'curriculum' | 'free';
  active: boolean;
  unitId?: string;
  activityKey?: string;
  practiceStage?: WordLearningStage;
  wordActivity?: WorkspaceWordActivity | null;
  setWordActivity?: (activity: WorkspaceWordActivity | null) => void;
  navigationOpen: boolean;
  setNavigationOpen: (open: boolean) => void;
  backToMap: () => void;
}
export const LearningWorkspaceContext = createContext<LearningWorkspace | null>(null);
export const useLearningWorkspace = () => useContext(LearningWorkspaceContext);
