import { create } from 'zustand';

const LS_KEY_PROJECT = 'cf_selectedProjectId';
const LS_KEY_CONTENT = 'cf_selectedContentId';

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

  setSelectedProjectId: (id: string | null) => void;
  setSelectedContentId: (id: string | null) => void;
  setSelectedLanguage: (lang: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Read persisted values on init
  selectedProjectId: readLS(LS_KEY_PROJECT),
  selectedContentId: readLS(LS_KEY_CONTENT),
  selectedLanguage: 'ko',

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
}));
