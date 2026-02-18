import { create } from 'zustand';

type EditorTab = 'character' | 'cover' | 'pages' | 'key-objects' | 'tts' | 'translation' | 'quiz';

interface EditorStore {
  // 선택된 동화책 ID
  selectedStorybookId: string | null;
  setSelectedStorybookId: (id: string | null) => void;

  // 현재 에디터 탭
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;

  // 모달
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;

  // 생성 진행률 (0-100)
  generationProgress: Record<string, number>;
  setGenerationProgress: (key: string, progress: number) => void;
  clearGenerationProgress: (key: string) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  selectedStorybookId: null,
  setSelectedStorybookId: (id) => set({ selectedStorybookId: id }),

  activeTab: 'character',
  setActiveTab: (tab) => set({ activeTab: tab }),

  isCreateModalOpen: false,
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  generationProgress: {},
  setGenerationProgress: (key, progress) =>
    set((state) => ({ generationProgress: { ...state.generationProgress, [key]: progress } })),
  clearGenerationProgress: (key) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: _, ...rest } = state.generationProgress;
      return { generationProgress: rest };
    }),
}));
