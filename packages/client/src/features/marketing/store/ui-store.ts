import { create } from 'zustand';
import type { ContentKind } from '../types/database';

const LS_KEY_PROJECT = 'cf_selectedProjectId';
const LS_KEY_CONTENT = 'cf_selectedContentId';
const LS_KEY_KIND = 'cf_contentKindTab';

function readLS(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLS(key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore write errors (private browsing, storage full)
  }
}

interface UIState {
  selectedProjectId: string | null;
  selectedContentId: string | null;
  selectedLanguage: string;
  /** 콘텐츠 목록 상단 정규/광고 탭 (영속). */
  contentKindTab: ContentKind;

  setSelectedProjectId: (id: string | null) => void;
  setSelectedContentId: (id: string | null) => void;
  setSelectedLanguage: (lang: string) => void;
  setContentKindTab: (kind: ContentKind) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Read persisted values on init
  selectedProjectId: readLS(LS_KEY_PROJECT),
  selectedContentId: readLS(LS_KEY_CONTENT),
  selectedLanguage: 'ko',
  contentKindTab: readLS(LS_KEY_KIND) === 'ad' ? 'ad' : 'regular',

  setSelectedProjectId: (id) => {
    writeLS(LS_KEY_PROJECT, id);
    set({ selectedProjectId: id });
  },

  setSelectedContentId: (id) => {
    writeLS(LS_KEY_CONTENT, id);
    set({ selectedContentId: id });
  },

  setSelectedLanguage: (lang) => {
    set({ selectedLanguage: lang });
  },

  setContentKindTab: (kind) => {
    writeLS(LS_KEY_KIND, kind);
    set({ contentKindTab: kind });
  },
}));
