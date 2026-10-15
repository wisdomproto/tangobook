import { createContext, useContext } from 'react';

export interface LearningWorkspace {
  active: boolean;
  unitId?: string;
  activityKey?: string;
  navigationOpen: boolean;
  setNavigationOpen: (open: boolean) => void;
  backToMap: () => void;
}
export const LearningWorkspaceContext = createContext<LearningWorkspace | null>(null);
export const useLearningWorkspace = () => useContext(LearningWorkspaceContext);
