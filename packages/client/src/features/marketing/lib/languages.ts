/**
 * 마케팅 콘텐츠의 기본 타겟 언어.
 * 새 프로젝트 생성 시 이 언어들로 시작하고, 콘텐츠 편집·키워드·번역 탭이 공유한다.
 * ko 는 항상 맨 앞(고정). 코드는 shared `SUPPORTED_LANGUAGES` 와 일치해야 한다.
 */
export const DEFAULT_TARGET_LANGUAGES = ['ko', 'en', 'zh', 'th', 'vi'] as const;
