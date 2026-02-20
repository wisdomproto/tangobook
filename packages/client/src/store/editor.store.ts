import { create } from 'zustand';

type EditorTab =
  | 'settings'
  | 'character'
  | 'cover'
  | 'pages'
  | 'key-objects'
  | 'quiz'
  | 'audiobook';

interface EditorStore {
  // 선택된 동화책 ID
  selectedStorybookId: string | null;
  setSelectedStorybookId: (id: string | null) => void;

  // 새 동화책 만들기 폼 표시
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;

  // 현재 에디터 탭
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;

  // 사이드바 검색/필터
  sidebarSearch: string;
  setSidebarSearch: (search: string) => void;
  sidebarCategory: string;
  setSidebarCategory: (category: string) => void;
  sidebarVisibility: 'all' | 'public' | 'private';
  setSidebarVisibility: (v: 'all' | 'public' | 'private') => void;
  sidebarSort: 'latest' | 'title';
  setSidebarSort: (sort: 'latest' | 'title') => void;
  sidebarFolder: string;
  setSidebarFolder: (folder: string) => void;
  customFolders: string[];
  addCustomFolder: (folder: string) => void;
  removeCustomFolder: (folder: string) => void;

  // 생성 진행률 (0-100)
  generationProgress: Record<string, number>;
  setGenerationProgress: (key: string, progress: number) => void;
  clearGenerationProgress: (key: string) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  selectedStorybookId: null,
  setSelectedStorybookId: (id) => set({ selectedStorybookId: id, showCreateForm: false }),

  showCreateForm: false,
  setShowCreateForm: (show) =>
    set(show ? { showCreateForm: true, selectedStorybookId: null } : { showCreateForm: false }),

  activeTab: 'character',
  setActiveTab: (tab) => set({ activeTab: tab }),

  sidebarSearch: '',
  setSidebarSearch: (search) => set({ sidebarSearch: search }),
  sidebarCategory: 'all',
  setSidebarCategory: (category) => set({ sidebarCategory: category }),
  sidebarVisibility: 'all',
  setSidebarVisibility: (v) => set({ sidebarVisibility: v }),
  sidebarSort: 'latest',
  setSidebarSort: (sort) => set({ sidebarSort: sort }),
  sidebarFolder: 'all',
  setSidebarFolder: (folder) => set({ sidebarFolder: folder }),
  customFolders: [],
  addCustomFolder: (folder) =>
    set((state) => ({
      customFolders: state.customFolders.includes(folder)
        ? state.customFolders
        : [...state.customFolders, folder],
    })),
  removeCustomFolder: (folder) =>
    set((state) => ({ customFolders: state.customFolders.filter((f) => f !== folder) })),

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
