import { createContext, useContext, type ReactNode } from 'react';

/**
 * 활성 편집 언어 컨텍스트.
 *
 * - /editor2 (variant 인지) 가 EditorContent 를 이 Provider 로 감싸서 활성 언어 (ko/en/ja/...)를 주입한다.
 * - 각 탭(PagesTab, CoverTab, KeyObjectTab 등) 은 `useEditorLang()` 로 현재 언어를 읽어서 해당 언어 텍스트만 보여줌.
 * - /editor (v1 백업) 는 Provider 로 감싸지 않으므로 `null` 반환 → 각 탭은 자체 언어 sub-탭으로 폴백.
 *   따라서 v1 동작 변경 없음.
 */
const EditorLangContext = createContext<string | null>(null);

export function EditorLangProvider({ lang, children }: { lang: string; children: ReactNode }) {
  return <EditorLangContext.Provider value={lang}>{children}</EditorLangContext.Provider>;
}

/** 외부 (Provider) 가 주입한 활성 언어. 없으면 null — 컴포넌트는 자체 fallback 사용. */
export function useEditorLang(): string | null {
  return useContext(EditorLangContext);
}
