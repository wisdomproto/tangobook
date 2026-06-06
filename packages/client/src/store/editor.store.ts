import { create } from 'zustand';
import { STORYBOOK_CATEGORIES, PHONICS_CATEGORIES } from '@tangobook/shared';

export type CategoryTab = 'storybook' | 'phonics-ko' | 'phonics-en' | 'vocabulary';

const defaultCategoriesForTab = (tab: CategoryTab): string[] => {
  if (tab === 'storybook') return [...STORYBOOK_CATEGORIES];
  if (tab === 'vocabulary') return []; // vocabulary 탭은 별도 sidebar 사용
  return [...PHONICS_CATEGORIES];
};

type EditorTab =
  | 'meta'
  | 'settings'
  | 'character'
  | 'cover'
  | 'pages'
  | 'key-objects'
  | 'hidden-object'
  | 'quiz'
  | 'audiobook'
  | 'blog'
  | 'card-news'
  | 'learning-cards'
  | 'chant'
  | 'flashcards'
  | 'games'
  | 'longform-video';

type CreateFormType = 'storybook' | 'phonics';
type SidebarTypeFilter = 'storybook' | 'phonics-ko' | 'phonics-en' | 'vocabulary';

interface EditorStore {
  // 선택된 동화책 ID
  selectedStorybookId: string | null;
  setSelectedStorybookId: (id: string | null) => void;

  // 새 동화책 만들기 폼 표시
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  createFormType: CreateFormType;
  setCreateFormType: (type: CreateFormType) => void;

  // 사이드바 타입 필터
  sidebarTypeFilter: SidebarTypeFilter;
  setSidebarTypeFilter: (filter: SidebarTypeFilter) => void;

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
  /**
   * @deprecated typeFilter 별로 분리된 `sidebarSortByType` 사용.
   * 호환을 위해 남겨두지만 새 코드는 `getSidebarSort()` / `setSidebarSort()` (typeFilter 자동 분기) 사용.
   */
  sidebarSort: 'latest' | 'title';
  /**
   * typeFilter 별 정렬. 파닉스 탭은 unit 번호 순서 (제목순) 가 학습 흐름에 자연스러워 디폴트 'title'.
   * 동화책/어휘는 새 작업이 위에 오게 'latest'.
   * key 매핑: 'storybook' / 'phonics-ko'+'phonics-en' = 'phonics' (둘이 한 정렬 공유) / 'vocabulary'.
   */
  sidebarSortByType: Record<'storybook' | 'phonics' | 'vocabulary', 'latest' | 'title'>;
  setSidebarSort: (sort: 'latest' | 'title') => void;
  sidebarFolder: string;
  setSidebarFolder: (folder: string) => void;
  customFolders: string[];
  addCustomFolder: (folder: string) => void;
  removeCustomFolder: (folder: string) => void;
  // Per-tab folder state
  foldersByTab: Record<string, { folder: string; customFolders: string[] }>;
  setFolderForTab: (tab: string, folder: string) => void;
  addCustomFolderForTab: (tab: string, folder: string) => void;
  removeCustomFolderForTab: (tab: string, folder: string) => void;
  renameCustomFolderForTab: (tab: string, oldName: string, newName: string) => void;

  // Per-tab category management (사용자 추가/제거/순서 이동)
  // 값이 없으면 defaultCategoriesForTab(tab) 폴백
  categoriesByTab: Partial<Record<CategoryTab, string[]>>;
  getCategoriesForTab: (tab: CategoryTab) => string[];
  addCategoryForTab: (tab: CategoryTab, name: string) => void;
  removeCategoryForTab: (tab: CategoryTab, name: string) => void;
  moveCategoryForTab: (tab: CategoryTab, name: string, direction: 'up' | 'down') => void;
  renameCategoryForTab: (tab: CategoryTab, oldName: string, newName: string) => void;
  resetCategoriesForTab: (tab: CategoryTab) => void;

  // 생성 진행률 (0-100)
  generationProgress: Record<string, number>;
  setGenerationProgress: (key: string, progress: number) => void;
  clearGenerationProgress: (key: string) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  selectedStorybookId: null,
  setSelectedStorybookId: (id) =>
    set({ selectedStorybookId: id, showCreateForm: false, activeTab: 'settings' }),

  showCreateForm: false,
  setShowCreateForm: (show) =>
    set(show ? { showCreateForm: true, selectedStorybookId: null } : { showCreateForm: false }),
  createFormType: 'storybook',
  setCreateFormType: (type) => set({ createFormType: type }),

  sidebarTypeFilter: 'storybook',
  setSidebarTypeFilter: (filter) => set({ sidebarTypeFilter: filter }),

  activeTab: 'character',
  setActiveTab: (tab) => set({ activeTab: tab }),

  sidebarSearch: '',
  setSidebarSearch: (search) => set({ sidebarSearch: search }),
  sidebarCategory: 'all',
  setSidebarCategory: (category) => set({ sidebarCategory: category }),
  sidebarVisibility: 'all',
  setSidebarVisibility: (v) => set({ sidebarVisibility: v }),
  sidebarSort: 'latest',
  sidebarSortByType: {
    storybook: 'latest',
    phonics: 'title',
    vocabulary: 'latest',
  },
  setSidebarSort: (sort) =>
    set((state) => {
      // 현재 활성 typeFilter 에 해당하는 sort 만 업데이트.
      // 'phonics-ko' / 'phonics-en' 은 한 'phonics' 키로 통합.
      const f = state.sidebarTypeFilter;
      const key: 'storybook' | 'phonics' | 'vocabulary' =
        f === 'phonics-ko' || f === 'phonics-en'
          ? 'phonics'
          : f === 'vocabulary'
            ? 'vocabulary'
            : 'storybook';
      return {
        sidebarSort: sort,
        sidebarSortByType: { ...state.sidebarSortByType, [key]: sort },
      };
    }),
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

  foldersByTab: {},
  setFolderForTab: (tab, folder) =>
    set((state) => ({
      foldersByTab: {
        ...state.foldersByTab,
        [tab]: { ...(state.foldersByTab[tab] ?? { folder: 'all', customFolders: [] }), folder },
      },
    })),
  addCustomFolderForTab: (tab, folder) =>
    set((state) => {
      const prev = state.foldersByTab[tab] ?? { folder: 'all', customFolders: [] };
      return {
        foldersByTab: {
          ...state.foldersByTab,
          [tab]: {
            ...prev,
            customFolders: prev.customFolders.includes(folder)
              ? prev.customFolders
              : [...prev.customFolders, folder],
          },
        },
      };
    }),
  removeCustomFolderForTab: (tab, folder) =>
    set((state) => {
      const prev = state.foldersByTab[tab] ?? { folder: 'all', customFolders: [] };
      return {
        foldersByTab: {
          ...state.foldersByTab,
          [tab]: {
            ...prev,
            folder: prev.folder === folder ? 'all' : prev.folder,
            customFolders: prev.customFolders.filter((f) => f !== folder),
          },
        },
      };
    }),
  renameCustomFolderForTab: (tab, oldName, newName) =>
    set((state) => {
      const prev = state.foldersByTab[tab] ?? { folder: 'all', customFolders: [] };
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return state;
      const customFolders = prev.customFolders.includes(oldName)
        ? prev.customFolders.map((f) => (f === oldName ? trimmed : f))
        : prev.customFolders.includes(trimmed)
          ? prev.customFolders
          : [...prev.customFolders, trimmed];
      return {
        foldersByTab: {
          ...state.foldersByTab,
          [tab]: {
            ...prev,
            folder: prev.folder === oldName ? trimmed : prev.folder,
            customFolders,
          },
        },
      };
    }),

  categoriesByTab: {},
  getCategoriesForTab: (tab) => {
    const list = get().categoriesByTab[tab];
    return list ?? defaultCategoriesForTab(tab);
  },
  addCategoryForTab: (tab, name) =>
    set((state) => {
      const trimmed = name.trim();
      if (!trimmed) return state;
      const current = state.categoriesByTab[tab] ?? defaultCategoriesForTab(tab);
      if (current.includes(trimmed)) return state;
      return {
        categoriesByTab: {
          ...state.categoriesByTab,
          [tab]: [...current, trimmed],
        },
      };
    }),
  removeCategoryForTab: (tab, name) =>
    set((state) => {
      const current = state.categoriesByTab[tab] ?? defaultCategoriesForTab(tab);
      if (!current.includes(name)) return state;
      return {
        categoriesByTab: {
          ...state.categoriesByTab,
          [tab]: current.filter((c) => c !== name),
        },
      };
    }),
  moveCategoryForTab: (tab, name, direction) =>
    set((state) => {
      const current = state.categoriesByTab[tab] ?? defaultCategoriesForTab(tab);
      const idx = current.indexOf(name);
      if (idx < 0) return state;
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= current.length) return state;
      const next = [...current];
      [next[idx], next[target]] = [next[target], next[idx]];
      return {
        categoriesByTab: { ...state.categoriesByTab, [tab]: next },
      };
    }),
  renameCategoryForTab: (tab, oldName, newName) =>
    set((state) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === oldName) return state;
      const current = state.categoriesByTab[tab] ?? defaultCategoriesForTab(tab);
      if (!current.includes(oldName) || current.includes(trimmed)) return state;
      return {
        categoriesByTab: {
          ...state.categoriesByTab,
          [tab]: current.map((c) => (c === oldName ? trimmed : c)),
        },
      };
    }),
  resetCategoriesForTab: (tab) =>
    set((state) => {
      const next = { ...state.categoriesByTab };
      delete next[tab];
      return { categoriesByTab: next };
    }),

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
